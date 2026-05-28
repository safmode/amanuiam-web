<?php

namespace App\Http\Controllers;

use App\Services\CloudinaryService;
use App\Models\Report;
use App\Models\Student;
use App\Models\Officer;
use App\Models\UnregisteredReporter;
use App\Traits\LocationMatchingTrait;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Http;

class ReportController extends Controller
{
    use LocationMatchingTrait;

    protected $cloudinary;

    // Helper function to send Telegram messages directly
    private function sendTelegramMessage($chatId, $message)
    {
        $token = env('TELEGRAM_BOT_TOKEN');

        if (!$token) {
            \Log::error('TELEGRAM_BOT_TOKEN not set');
            return false;
        }

        if (!$chatId) {
            \Log::warning('No chat ID provided');
            return false;
        }

        try {
            $response = Http::timeout(10)->post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'Markdown'
            ]);

            if ($response->successful()) {
                \Log::info('Telegram message sent', ['chat_id' => $chatId]);
                return true;
            } else {
                \Log::error('Telegram API error', ['response' => $response->body()]);
                return false;
            }
        } catch (\Exception $e) {
            \Log::error('Telegram send error: ' . $e->getMessage());
            return false;
        }
    }

    public function __construct(CloudinaryService $cloudinary)
    {
        $this->cloudinary = $cloudinary;

        // Initialize location matching trait
        $this->initLocationMatching();
    }

    // ============================================
    // AI METHODS (KEEP YOUR EXISTING IMPLEMENTATIONS)
    // ============================================

    private function aiCategorizeReport($description)
    {
        try {
            $apiKey = env('HUGGINGFACE_API_KEY', '');

            if (!$apiKey) {
                \Log::warning('Hugging Face API key not set');
                return null;
            }

            $categories = [
                'theft' => 'theft, robbery, stealing, stolen property, stolen items',
                'harassment' => 'harassment, bullying, verbal abuse, intimidation, threatening, sexual harassment',
                'vandalism' => 'vandalism, property damage, graffiti, broken, destruction',
                'fireHazard' => 'fire hazard, fire, smoke, burning, flammable, explosion',
                'suspiciousActivity' => 'suspicious activity, strange behavior, lurking, following',
                'facilityIssue' => 'facility issue, maintenance, broken equipment, lights out, leak',
                'wildAnimal' => 'wild animal, snake, stray dog, animal threat, monkey',
                'trespassing' => 'trespassing, unauthorized entry, breaking in, intrusion',
                'emergency_alert' => 'emergency, danger, immediate threat, help needed',
                'other' => 'other issues not mentioned above'
            ];

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(10)->post('https://api-inference.huggingface.co/models/facebook/bart-large-mnli', [
                'inputs' => $description,
                'parameters' => [
                    'candidate_labels' => array_keys($categories),
                    'hypothesis_template' => 'This incident is about {}'
                ]
            ]);

            if ($response->successful()) {
                $result = $response->json();
                $scores = $result['scores'] ?? [];
                $labels = $result['labels'] ?? [];

                if (!empty($labels) && !empty($scores)) {
                    $bestMatch = $labels[array_search(max($scores), $scores)];
                    $bestScore = max($scores);

                    if ($bestScore > 0.3) {
                        return $bestMatch;
                    }
                }
            }

            return null;
        } catch (\Exception $e) {
            \Log::error('AI Categorization failed: ' . $e->getMessage());
            return null;
        }
    }

    private function keywordCategorizeReport($description)
    {
        $descLower = strtolower($description);

        $keywordMap = [
            'theft' => ['stole', 'steal', 'stolen', 'theft', 'robbery', 'rob', 'thief', 'missing', 'laptop', 'phone', 'wallet', 'money', 'cash'],
            'harassment' => ['harass', 'bully', 'intimidate', 'threaten', 'verbal abuse', 'insult', 'stalking', 'followed'],
            'vandalism' => ['vandal', 'graffiti', 'damage', 'destroy', 'broken', 'smashed', 'cracked'],
            'fireHazard' => ['fire', 'smoke', 'burning', 'flammable', 'explosion', 'gas leak'],
            'suspiciousActivity' => ['suspicious', 'strange', 'weird', 'lurking', 'prowling', 'unknown person'],
            'facilityIssue' => ['maintenance', 'broken', 'not working', 'leak', 'light out', 'repair'],
            'wildAnimal' => ['snake', 'stray dog', 'monkey', 'wild boar', 'animal attack', 'bite'],
            'trespassing' => ['trespassing', 'unauthorized', 'breaking in', 'intrusion', 'forced entry'],
            'emergency_alert' => ['emergency', 'danger', 'urgent', 'critical', 'help', 'immediate']
        ];

        $scores = [];
        foreach ($keywordMap as $category => $keywords) {
            $score = 0;
            foreach ($keywords as $keyword) {
                if (strpos($descLower, $keyword) !== false) {
                    $score++;
                }
            }
            if ($score > 0) {
                $scores[$category] = $score;
            }
        }

        if (!empty($scores)) {
            return array_keys($scores, max($scores))[0];
        }

        return 'other';
    }

    private function aiDetectUrgency($description, $category = null)
    {
        $urgentKeywords = [
            'fire', 'emergency', 'injured', 'bleeding', 'attack', 'assault',
            'weapon', 'danger', 'immediate', 'urgent', 'threat', 'violence',
            'hurt', 'unconscious', 'blood', 'fight', 'crash'
        ];

        $descLower = strtolower($description);

        foreach ($urgentKeywords as $keyword) {
            if (strpos($descLower, $keyword) !== false) {
                return 'urgent';
            }
        }

        if ($category === 'fireHazard' || $category === 'emergency_alert') {
            return 'urgent';
        }

        return 'general';
    }

    private function capitalizeMahallah($value)
    {
        if (!$value) return $value;
        return collect(explode(' ', $value))
            ->map(function($word) {
                return ucfirst(strtolower($word));
            })
            ->implode(' ');
    }

    private function getCategoryLabel($category)
    {
        $labels = [
            'theft' => 'Theft/Robbery',
            'harassment' => 'Harassment',
            'vandalism' => 'Vandalism',
            'fireHazard' => 'Fire Hazard',
            'suspiciousActivity' => 'Suspicious Activity',
            'facilityIssue' => 'Facility Issue',
            'wildAnimal' => 'Wild Animal',
            'trespassing' => 'Trespassing',
            'emergency_alert' => 'Emergency Alert',
            'other' => 'Other',
        ];

        return $labels[$category] ?? ucfirst(str_replace('_', ' ', $category));
    }

    public function analyzeWithAI(Request $request)
    {
        $description = $request->input('description');

        if (!$description) {
            return response()->json(['success' => false, 'error' => 'No description provided']);
        }

        $category = $this->aiCategorizeReport($description);

        if (!$category || $category === 'other') {
            $category = $this->keywordCategorizeReport($description);
        }

        $urgency = $this->aiDetectUrgency($description, $category);

        return response()->json([
            'success' => true,
            'category' => $category ?? 'other',
            'urgency' => $urgency,
        ]);
    }

    // ============================================
    // INDEX METHOD
    // ============================================

    public function index(Request $request)
    {
        $query = Report::query();

        // SIMPLE SEARCH - search through relationship
        if ($search = $request->get('search')) {
            // First, find students that match the search
            $matchingStudents = Student::where('name', 'like', "%$search%")
                ->orWhere('email', 'like', "%$search%")
                ->orWhere('matrixNumber', 'like', "%$search%")
                ->get();

            // Convert to ObjectId for MongoDB query
            $studentObjectIds = [];
            $studentStringIds = [];

            foreach ($matchingStudents as $student) {
                $studentObjectIds[] = new \MongoDB\BSON\ObjectId($student->_id);
                $studentStringIds[] = (string)$student->_id;
            }

            // Get matric numbers
            $matricNumbers = Student::where('matrixNumber', 'like', "%$search%")
                ->pluck('matrixNumber')
                ->toArray();

            // Search reports
            $query->where(function ($q) use ($search, $studentObjectIds, $studentStringIds, $matricNumbers) {
                // Search report fields
                $q->where('reportId', 'like', "%$search%")
                ->orWhere('description', 'like', "%$search%")
                ->orWhere('mahallah', 'like', "%$search%")
                ->orWhere('incidentCategory', 'like', "%$search%")
                ->orWhere('location.building', 'like', "%$search%")
                ->orWhere('location.address', 'like', "%$search%");

                // Search by studentId as ObjectId (for reports with ObjectId)
                if (!empty($studentObjectIds)) {
                    $q->orWhereIn('studentId', $studentObjectIds);
                }

                // Search by studentId as string (for reports with string IDs)
                if (!empty($studentStringIds)) {
                    $q->orWhereIn('studentId', $studentStringIds);
                }

                // Search by studentId as matric number
                if (!empty($matricNumbers)) {
                    $q->orWhereIn('studentId', $matricNumbers);
                }

                // Direct string search on studentId
                $q->orWhere('studentId', 'like', "%$search%");
            });
        }

        // Apply filters
        if ($statuses = $request->get('status')) {
            $query->whereIn('status', explode(',', $statuses));
        }
        if ($urgencies = $request->get('urgency')) {
            $query->whereIn('urgency', explode(',', $urgencies));
        }
        if ($categories = $request->get('category')) {
            $query->whereIn('incidentCategory', explode(',', $categories));
        }

        // ENHANCED LOCATION FILTERING using LocationMatchingTrait
        if ($locations = $request->get('locations')) {
            $locationArray = explode(',', $locations);

            // First, get all reports
            $allReports = $query->get();

            // Filter reports by determining their actual location using proximity
            $filteredReportIds = [];
            foreach ($allReports as $report) {
                $determinedLocation = $this->determineReportLocation($report);
                if ($determinedLocation && in_array($determinedLocation, $locationArray)) {
                    $filteredReportIds[] = $report->_id;
                    \Log::debug("Report {$report->reportId} matched location filter: {$determinedLocation}");
                } else {
                    // Also check original location fields as fallback
                    $mahallah = $report->mahallah ?? '';
                    $locationArea = '';
                    $location = $report->location;
                    if (is_array($location)) {
                        $locationArea = $location['locationArea'] ?? '';
                    }

                    $searchText = strtolower($mahallah . ' ' . $locationArea);
                    foreach ($locationArray as $locationFilter) {
                        if (strpos($searchText, strtolower($locationFilter)) !== false) {
                            $filteredReportIds[] = $report->_id;
                            \Log::debug("Report {$report->reportId} matched location filter by keyword: {$locationFilter}");
                            break;
                        }
                    }
                }
            }

            // Apply the filter to the query
            if (!empty($filteredReportIds)) {
                $query->whereIn('_id', array_unique($filteredReportIds));
            } else {
                // No matches, force empty result
                $query->whereIn('_id', []);
            }
        }

        if ($dateFrom = $request->get('dateFrom')) {
            $query->whereDate('incidentDateTime', '>=', $dateFrom);
        }
        if ($dateTo = $request->get('dateTo')) {
            $query->whereDate('incidentDateTime', '<=', $dateTo);
        }

        // Check if this is an export request
        $isExport = $request->boolean('export');

        if ($isExport) {
            // Return all records without pagination for export
            $reports = $query->orderBy('reportedAt', 'desc')->get();

            // Transform reports with student and officer data for export
            $reports->transform(function ($report) {
                // Add determined location
                $report->determinedLocation = $this->determineReportLocation($report);

                // Add student info
                if ($report->studentId) {
                    $student = Student::find($report->studentId);
                    if ($student) {
                        $report->studentName = $student->name;
                        $report->studentEmail = $student->email;
                        $report->studentPhone = $student->phone;
                        $report->studentMatrix = $student->matrixNumber;
                    } else {
                        // Try by matric number
                        $student = Student::where('matrixNumber', $report->studentId)->first();
                        if ($student) {
                            $report->studentName = $student->name;
                            $report->studentEmail = $student->email;
                            $report->studentPhone = $student->phone;
                            $report->studentMatrix = $student->matrixNumber;
                        } else {
                            $report->studentName = 'Unknown';
                            $report->studentEmail = null;
                            $report->studentPhone = null;
                            $report->studentMatrix = null;
                        }
                    }
                } else {
                    $report->studentName = 'Unknown';
                    $report->studentEmail = null;
                    $report->studentPhone = null;
                    $report->studentMatrix = null;
                }

                // Add officer info
                if ($report->assignedOfficer) {
                    $officer = Officer::where('officerId', $report->assignedOfficer)->first();
                    $report->officerName = $officer->officerName ?? 'Not Assigned';
                } else {
                    $report->officerName = 'Not Assigned';
                }

                return $report;
            });

            return response()->json([
                'data' => $reports,
                'total' => $reports->count()
            ]);
        }

        // Original paginated response for normal view
        $reports = $query->orderBy('reportedAt', 'desc')->paginate(10)->withQueryString();

        // Get all student IDs from reports
        $studentIds = [];
        foreach ($reports as $report) {
            if ($report->studentId) {
                // Convert ObjectId to string if needed
                $studentIds[] = (string)$report->studentId;
            }
        }

        // Fetch students
        $students = collect();
        if (!empty($studentIds)) {
            $students = Student::whereIn('_id', $studentIds)->get()->keyBy(function($item) {
                return (string)$item->_id;
            });

            // Also try by matric for string IDs
            $stringIds = array_filter($studentIds, function($id) {
                return !preg_match('/^[a-f0-9]{24}$/i', $id);
            });
            if (!empty($stringIds)) {
                $studentsByMatric = Student::whereIn('matrixNumber', $stringIds)->get()->keyBy('matrixNumber');
                $students = $students->merge($studentsByMatric);
            }
        }

        $officers = Officer::all()->keyBy('officerId');

        // Add student names, officer names, and determined location to reports
        $reports->getCollection()->transform(function ($report) use ($students, $officers) {
            $studentId = (string)$report->studentId;

            // Get proximity-matched location for FILTERING only (don't change original)
            $report->determinedLocation = $this->determineReportLocation($report);

            // Keep the original location for DISPLAY
            // The original location is already in $report->location['locationArea'] or $report->mahallah

            // Get student info
            if (isset($students[$studentId])) {
                $student = $students[$studentId];
                $report->studentName = $student->name;
                $report->studentEmail = $student->email;
                $report->studentPhone = $student->phone;
                $report->studentMatrix = $student->matrixNumber;
            } else {
                $report->studentName = 'Unknown';
                $report->studentEmail = null;
                $report->studentPhone = null;
                $report->studentMatrix = null;
            }

            // Get officer info
            if ($report->assignedOfficer && isset($officers[$report->assignedOfficer])) {
                $report->officerName = $officers[$report->assignedOfficer]->officerName;
            } else {
                $report->officerName = 'Not Assigned';
            }

            $report->incidentLocation = $report->getFullAddress();

            return $report;
        });

        $statusCounts = [
            'pending'     => Report::where('status', 'pending')->count(),
            'in_progress' => Report::where('status', 'in_progress')->count(),
            'resolved'    => Report::where('status', 'resolved')->count(),
            'nfa'         => Report::where('status', 'nfa')->count(),
        ];

        $uniqueLocations = Report::raw(function($collection) {
            return $collection->aggregate([
                ['$group' => [
                    '_id' => null,
                    'buildings' => ['$addToSet' => '$location.building'],
                    'addresses' => ['$addToSet' => '$location.address'],
                    'mahallahs' => ['$addToSet' => '$mahallah']
                ]]
            ]);
        })->first();

        $allLocations = [];
        if ($uniqueLocations) {
            $allLocations = array_merge(
                $uniqueLocations['buildings'] ?? [],
                $uniqueLocations['addresses'] ?? [],
                $uniqueLocations['mahallahs'] ?? []
            );
            $allLocations = array_filter($allLocations);
            $allLocations = array_values(array_unique($allLocations));
        }

        return Inertia::render('Reports', [
            'reports'         => $reports,
            'statusCounts'    => $statusCounts,
            'uniqueLocations' => $allLocations,
            'filters'         => $request->only([
                'search', 'status', 'urgency', 'category', 'locations', 'dateFrom', 'dateTo'
            ]),
        ]);
    }

    // ============================================
    // CRUD METHODS
    // ============================================

    public function store(Request $request)
    {
        \Log::info('Store request received', [
            'data' => $request->all()
        ]);

        $validated = $request->validate([
            'studentId'        => 'nullable|string',
            'studentName'      => 'nullable|string',
            'studentEmail'     => 'nullable|email',
            'studentPhone'     => 'nullable|string',
            'studentMatric'    => 'nullable|string',
            'incidentCategory' => 'nullable|string',
            'description'      => 'required|string',
            'incidentDateTime' => 'required|date',
            'urgency'          => 'nullable|in:general,urgent',
            'injuries'         => 'nullable|string',
            'damages'          => 'nullable|string',
            'suspectDescription' => 'nullable|string',
            'assignedOfficer'  => 'nullable|string',
            'officerNotes'     => 'nullable|string',
            'attachmentUrls'   => 'nullable|array',
            'attachmentPublicIds' => 'nullable|array',
            'location'         => 'nullable|array',
        ]);

        // Handle location object from AddReport
        if ($request->has('location') && is_array($request->location)) {
            $locationData = $request->location;
            $validated['location'] = $locationData;

            if (isset($locationData['locationArea'])) {
                $validated['mahallah'] = $this->capitalizeMahallah($locationData['locationArea']);
            }
            if (isset($locationData['building'])) {
                $validated['building'] = $locationData['building'];
            }
            if (isset($locationData['address'])) {
                $validated['address'] = $locationData['address'];
            }
        }

        if (!isset($validated['mahallah']) || empty($validated['mahallah'])) {
            $validated['mahallah'] = 'Unknown Location';
        }

        // === AI Auto-categorize ===
        if (empty($validated['incidentCategory'])) {
            $aiCategory = $this->aiCategorizeReport($validated['description']);

            if (!$aiCategory || $aiCategory === 'other') {
                $aiCategory = $this->keywordCategorizeReport($validated['description']);
                \Log::info('Using keyword fallback for category: ' . $aiCategory);
            }

            if ($aiCategory && $aiCategory !== 'other') {
                $validated['incidentCategory'] = $aiCategory;
                \Log::info('AI categorized report as: ' . $aiCategory);
            } else {
                $validated['incidentCategory'] = 'other';
            }
        }

        // === AI Auto-detect urgency ===
        if (empty($validated['urgency'])) {
            $validated['urgency'] = $this->aiDetectUrgency(
                $validated['description'],
                $validated['incidentCategory']
            );
            \Log::info('AI set urgency to: ' . $validated['urgency']);
        }

        $validated['mahallah'] = $this->capitalizeMahallah($validated['mahallah']);

        // Generate sequential Report ID
        $validated['reportId'] = Report::generateReportId();

        $validated['status'] = 'pending';
        $validated['reportedAt'] = now();

        // Check if this is a registered student
        $registeredStudent = null;

        if ($request->filled('studentMatric')) {
            $registeredStudent = Student::where('matrixNumber', $request->studentMatric)->first();
        }

        if (!$registeredStudent && $request->filled('studentId') && strlen($request->studentId) === 24) {
            $registeredStudent = Student::find($request->studentId);
        }

        if ($registeredStudent) {
            $validated['reporter_type'] = 'registered';
            $validated['reporter_id'] = (string)$registeredStudent->_id;
        } else {
            $existingReporter = null;

            if ($request->filled('studentMatric')) {
                $existingReporter = UnregisteredReporter::where('matric_number', $request->studentMatric)->first();
            }
            if (!$existingReporter && $request->filled('studentEmail')) {
                $existingReporter = UnregisteredReporter::where('email', $request->studentEmail)->first();
            }
            if (!$existingReporter && $request->filled('studentPhone')) {
                $existingReporter = UnregisteredReporter::where('phone', $request->studentPhone)->first();
            }

            if ($existingReporter) {
                $existingReporter->reports_count = ($existingReporter->reports_count ?? 0) + 1;
                $existingReporter->last_report_date = now();

                if ($request->studentName && ($existingReporter->name === 'Anonymous' || !$existingReporter->name)) {
                    $existingReporter->name = $request->studentName;
                }
                if ($request->studentEmail && !$existingReporter->email) {
                    $existingReporter->email = $request->studentEmail;
                }
                if ($request->studentPhone && !$existingReporter->phone) {
                    $existingReporter->phone = $request->studentPhone;
                }
                if ($request->studentMatric && !$existingReporter->matric_number) {
                    $existingReporter->matric_number = $request->studentMatric;
                }
                $existingReporter->save();
                $reporterId = (string)$existingReporter->_id;
            } else {
                $newReporter = UnregisteredReporter::create([
                    'name' => $request->studentName ?? 'Anonymous',
                    'email' => $request->studentEmail,
                    'phone' => $request->studentPhone,
                    'matric_number' => $request->studentMatric,
                    'reports_count' => 1,
                    'first_report_date' => now(),
                    'last_report_date' => now(),
                ]);
                $reporterId = (string)$newReporter->_id;
            }

            $validated['reporter_type'] = 'unregistered';
            $validated['reporter_id'] = $reporterId;
        }

        if ($request->has('attachmentUrls') && !empty($request->attachmentUrls)) {
            $validated['attachmentUrls'] = $request->attachmentUrls;
            $validated['attachmentPublicIds'] = $request->attachmentPublicIds ?? [];
            \Log::info('Using attachments from request', [
                'urls' => count($request->attachmentUrls),
                'public_ids' => count($request->attachmentPublicIds ?? [])
            ]);
        }

        $report = Report::create($validated);

        NotificationController::createNewReport($report);

        if ($report->urgency === 'urgent') {
            NotificationController::createEmergencyAlert($report);
        }

        return redirect()->back()->with('success', 'Report created successfully.');
    }

    public function getRecent(Request $request)
    {
        $recentReports = Report::orderBy('reportedAt', 'desc')
            ->limit(10)
            ->get();

        $recentReports->transform(function ($report) {
            // Initialize default values
            $report->studentName = 'Unknown';
            $report->studentEmail = null;
            $report->studentPhone = null;
            $report->studentMatrix = null;

            if ($report->reporter_type === 'registered' && $report->reporter_id) {
                $student = Student::find($report->reporter_id);
                if ($student) {
                    $report->studentName = $student->name;
                    $report->studentEmail = $student->email;
                    $report->studentPhone = $student->phone;
                    $report->studentMatrix = $student->matrixNumber;
                }
            } elseif ($report->reporter_type === 'unregistered' && $report->reporter_id) {
                $unregistered = UnregisteredReporter::find($report->reporter_id);
                if ($unregistered) {
                    $report->studentName = $unregistered->name;
                    $report->studentEmail = $unregistered->email;
                    $report->studentPhone = $unregistered->phone;
                    $report->studentMatrix = $unregistered->matric_number;
                }
            } elseif ($report->studentId) {
                // Fallback for legacy reports
                $student = Student::find($report->studentId);
                if ($student) {
                    $report->studentName = $student->name;
                    $report->studentEmail = $student->email;
                    $report->studentPhone = $student->phone;
                    $report->studentMatrix = $student->matrixNumber;
                }
            }

            // Also try to find by matric number if studentId is a string
            if ((!$report->studentName || $report->studentName === 'Unknown') && $report->studentId && !preg_match('/^[a-f0-9]{24}$/i', $report->studentId)) {
                $student = Student::where('matrixNumber', $report->studentId)->first();
                if ($student) {
                    $report->studentName = $student->name;
                    $report->studentEmail = $student->email;
                    $report->studentPhone = $student->phone;
                    $report->studentMatrix = $student->matrixNumber;
                }
            }

            return $report;
        });

        return response()->json([
            'recentReports' => $recentReports,
            'stats' => [
                'totalReports' => Report::count(),
                'pendingReports' => Report::where('status', 'pending')->count(),
                'inProgressReports' => Report::where('status', 'in_progress')->count(),
                'resolvedReports' => Report::where('status', 'resolved')->count(),
                'nfaReports' => Report::where('status', 'nfa')->count(),
                'emergencyAlerts' => Report::where('urgency', 'urgent')->where('status', '!=', 'resolved')->count(),
            ],
            'lastUpdated' => now()->toDateTimeString(),
        ]);
    }

    public function destroy($reportId)
    {
        $report = Report::where('reportId', $reportId)->firstOrFail();

        if ($report->attachmentPublicIds) {
            foreach ($report->attachmentPublicIds as $publicId) {
                if ($publicId) {
                    try {
                        $this->cloudinary->deleteImage($publicId);
                        \Log::info('Deleted attachment from Cloudinary', ['public_id' => $publicId]);
                    } catch (\Exception $e) {
                        \Log::error('Failed to delete from Cloudinary: ' . $e->getMessage());
                    }
                }
            }
        }

        $report->delete();

        return redirect()->back()->with('success', 'Report deleted successfully.');
    }

    public function update(Request $request, $reportId)
    {
        try {
            \Log::info('Update request received', [
                'reportId' => $reportId,
                'data' => $request->all()
            ]);

            $report = Report::where('reportId', $reportId)->firstOrFail();
            $oldStatus = $report->status;
            $oldAssignedOfficer = $report->assignedOfficer;

            $validated = $request->validate([
                'status' => 'sometimes|string|in:pending,in_progress,resolved,nfa',
                'urgency' => 'sometimes|string|in:general,urgent',
                'incidentCategory' => 'sometimes|string',
                'assignedOfficer' => 'nullable|string',
                'description' => 'sometimes|string',
                'mahallah' => 'sometimes|string',
                'injuries' => 'nullable|string',
                'officerNotes' => 'nullable|string',
                'damages' => 'nullable|string',
                'suspectDescription' => 'nullable|string',
                'incidentDateTime' => 'nullable|date',
                'location' => 'nullable|array',
                'attachmentUrls' => 'nullable|array',
                'attachmentPublicIds' => 'nullable|array',
                'studentName' => 'nullable|string',
                'studentEmail' => 'nullable|email',
                'studentPhone' => 'nullable|string',
                'studentMatrix' => 'nullable|string',
                'building' => 'nullable|string',
                'address' => 'nullable|string',
            ]);

            if (isset($validated['mahallah'])) {
                $validated['mahallah'] = $this->capitalizeMahallah($validated['mahallah']);
            }

            // Handle location properly - combine locationArea (mahallah) and building
            if ($request->has('location') && is_array($request->location)) {
                $locationData = $request->location;
                $validated['location'] = $locationData;

                if (isset($locationData['locationArea'])) {
                    $validated['mahallah'] = $this->capitalizeMahallah($locationData['locationArea']);
                }
                if (isset($locationData['building'])) {
                    $validated['building'] = $locationData['building'];
                }
                if (isset($locationData['address'])) {
                    $validated['address'] = $locationData['address'];
                }
            }

            if ($request->has('mahallah') || $request->has('building') || $request->has('address')) {
                $existingLocation = $report->location ?? [];

                if ($request->has('mahallah')) {
                    $existingLocation['mahallah'] = $this->capitalizeMahallah($request->mahallah);
                    $validated['mahallah'] = $existingLocation['mahallah'];
                }
                if ($request->has('building')) {
                    $existingLocation['building'] = $request->building;
                    $validated['building'] = $request->building;
                }
                if ($request->has('address')) {
                    $existingLocation['address'] = $request->address;
                    $validated['address'] = $request->address;
                }

                $validated['location'] = $existingLocation;
            }

            if ($request->has('attachmentUrls')) {
                $validated['attachmentUrls'] = $request->attachmentUrls;
                $validated['attachmentPublicIds'] = $request->attachmentPublicIds ?? [];
            }

            if ($request->has('studentName')) {
                $validated['studentName'] = $request->studentName;
            }
            if ($request->has('studentEmail')) {
                $validated['studentEmail'] = $request->studentEmail;
            }
            if ($request->has('studentPhone')) {
                $validated['studentPhone'] = $request->studentPhone;
            }
            if ($request->has('studentMatrix')) {
                $validated['studentMatrix'] = $request->studentMatrix;
            }

            $validated = array_filter($validated, function ($value, $key) {
                if (($key === 'attachmentUrls' || $key === 'attachmentPublicIds') && is_array($value)) {
                    return true;
                }
                if ($value === 0 || $value === '0') {
                    return true;
                }
                if ($value === false) {
                    return true;
                }
                return $value !== null && $value !== '' && !(is_array($value) && empty($value) && $key !== 'attachmentUrls' && $key !== 'attachmentPublicIds');
            }, ARRAY_FILTER_USE_BOTH);

            $report->update($validated);

            // Telegram notifications (keep your existing code)
            $newAssignedOfficer = $report->assignedOfficer;
            $wasAssignedNow = ($oldAssignedOfficer !== $newAssignedOfficer) && !empty($newAssignedOfficer);

            if ($wasAssignedNow) {
                try {
                    $assignedOfficer = Officer::where('officerId', $newAssignedOfficer)->first();
                    if ($assignedOfficer && $assignedOfficer->telegram_chat_id && $assignedOfficer->receive_emergency) {
                        // Get reporter info
                        $reporterName = 'Unknown';
                        $reporterContact = '';
                        $reporterMatric = '';

                        if ($report->reporter_type === 'registered' && $report->reporter_id) {
                            $student = Student::find($report->reporter_id);
                            if ($student) {
                                $reporterName = $student->name;
                                $reporterContact = $student->phone;
                                $reporterMatric = $student->matrixNumber;
                            }
                        } elseif ($report->reporter_type === 'unregistered' && $report->reporter_id) {
                            $unregistered = UnregisteredReporter::find($report->reporter_id);
                            if ($unregistered) {
                                $reporterName = $unregistered->name;
                                $reporterContact = $unregistered->phone;
                                $reporterMatric = $unregistered->matric_number;
                            }
                        }

                        $location = $report->getFullAddress();
                        $dateTime = $report->incidentDateTime ? new \DateTime($report->incidentDateTime) : null;
                        $dateFormatted = $dateTime ? $dateTime->format('d/m/Y') : 'Unknown';
                        $timeFormatted = $dateTime ? $dateTime->format('H:i') : '';

                        $message = "📋 *REPORT ASSIGNED TO YOU* 📋\n\n";
                        $message .= "*{$assignedOfficer->officerName}*, you have been assigned to a report.\n\n";
                        $message .= "*Report ID:* `{$report->reportId}`\n";
                        $message .= "*Reporter:* {$reporterName}\n";
                        if ($reporterMatric) $message .= "*Matrix:* {$reporterMatric}\n";
                        if ($reporterContact) $message .= "*Phone:* {$reporterContact}\n";
                        $message .= "*Category:* " . ($this->getCategoryLabel($report->incidentCategory) ?? $report->incidentCategory) . "\n";
                        $message .= "*Location:* {$location}\n";
                        $message .= "*Date:* {$dateFormatted}\n";
                        if ($timeFormatted) $message .= "*Time:* {$timeFormatted}\n";
                        $message .= "*Urgency:* " . (($report->urgency === 'urgent') ? '🚨 URGENT' : 'General') . "\n\n";
                        $message .= "*Description:* " . (strlen($report->description) > 200 ? substr($report->description, 0, 200) . '...' : $report->description);

                        $this->sendTelegramMessage($assignedOfficer->telegram_chat_id, $message);
                    }
                } catch (\Exception $e) {
                    \Log::error('Failed to send Telegram notification: ' . $e->getMessage());
                }
            }

            // Status change notification
            if ($oldStatus !== $report->status) {
                try {
                    $statusLabels = ['pending' => 'Pending', 'in_progress' => 'In Progress', 'resolved' => 'Resolved', 'nfa' => 'No Further Action'];
                    $nodeServerUrl = env('NODE_SERVER_URL', 'http://localhost:3000');
                    Http::post($nodeServerUrl . '/api/notify-status-change', [
                        'reportId' => $report->reportId,
                        'studentId' => (string)$report->studentId,
                        'oldStatus' => $oldStatus,
                        'newStatus' => $report->status,
                        'title' => 'Report Status Updated',
                        'message' => "Your report #{$report->reportId} status changed from " . ($statusLabels[$oldStatus] ?? $oldStatus) . " to " . ($statusLabels[$report->status] ?? $report->status)
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Failed to notify mobile server: ' . $e->getMessage());
                }
            }

            return redirect()->back()->with('success', 'Report updated successfully.');
        } catch (\Exception $e) {
            \Log::error('Update failed: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Failed to update report: ' . $e->getMessage()]);
        }
    }

    public function getAttachments($reportId)
    {
        $report = Report::where('reportId', $reportId)->firstOrFail();

        $attachments = [];
        foreach ($report->attachmentUrls ?? [] as $index => $url) {
            $publicId = $report->attachmentPublicIds[$index] ?? null;
            if ($publicId) {
                $attachments[] = [
                    'original' => $url,
                    'thumbnail' => $this->cloudinary->getThumbnailUrl($publicId),
                    'medium' => $this->cloudinary->getOptimizedUrl($publicId, ['width' => 500]),
                    'large' => $this->cloudinary->getOptimizedUrl($publicId, ['width' => 1200]),
                    'public_id' => $publicId,
                ];
            } else {
                $attachments[] = ['original' => $url, 'thumbnail' => $url, 'medium' => $url, 'large' => $url, 'public_id' => null];
            }
        }

        return response()->json($attachments);
    }

    public function show($reportId)
    {
        $report = Report::where('reportId', $reportId)->firstOrFail();

        $attachments = [];
        foreach ($report->attachmentUrls ?? [] as $index => $url) {
            $publicId = $report->attachmentPublicIds[$index] ?? null;
            if ($publicId) {
                $attachments[] = [
                    'thumbnail' => $this->cloudinary->getThumbnailUrl($publicId),
                    'medium' => $this->cloudinary->getOptimizedUrl($publicId, ['width' => 500]),
                    'original' => $url,
                ];
            } else {
                $attachments[] = ['original' => $url, 'thumbnail' => $url, 'medium' => $url];
            }
        }

        $report->optimized_attachments = $attachments;

        return Inertia::render('Reports/Show', ['report' => $report]);
    }

    public function uploadAttachments(Request $request)
    {
        try {
            $request->validate([
                'attachments.*' => 'required|file|mimes:jpg,jpeg,png,gif,webp,pdf|max:5120',
                'reportId' => 'required|string',
            ]);

            $report = Report::where('reportId', $request->reportId)->first();
            if (!$report) {
                return response()->json(['success' => false, 'error' => 'Report not found'], 404);
            }

            $uploadedUrls = [];
            $uploadedPublicIds = [];

            foreach ($request->file('attachments') as $file) {
                $result = $this->cloudinary->getCloudinary()->uploadApi()->upload($file->getRealPath(), ['folder' => 'reports_attachments', 'resource_type' => 'auto']);
                $uploadedUrls[] = $result['secure_url'];
                $uploadedPublicIds[] = $result['public_id'];
            }

            $report->attachmentUrls = array_merge($report->attachmentUrls ?? [], $uploadedUrls);
            $report->attachmentPublicIds = array_merge($report->attachmentPublicIds ?? [], $uploadedPublicIds);
            $report->save();

            return response()->json(['success' => true, 'urls' => $uploadedUrls, 'publicIds' => $uploadedPublicIds]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function deleteAttachment(Request $request)
    {
        try {
            $request->validate([
                'reportId' => 'nullable|string',
                'attachmentUrl' => 'required|string',
                'attachmentPublicId' => 'nullable|string',
            ]);

            if ($request->reportId) {
                $report = Report::where('reportId', $request->reportId)->firstOrFail();
                $attachments = $report->attachmentUrls ?? [];
                $publicIds = $report->attachmentPublicIds ?? [];
                $index = array_search($request->attachmentUrl, $attachments);

                if ($index !== false) {
                    if (isset($publicIds[$index])) {
                        $this->cloudinary->deleteImage($publicIds[$index]);
                        unset($publicIds[$index]);
                    }
                    unset($attachments[$index]);
                }

                $report->attachmentUrls = array_values($attachments);
                $report->attachmentPublicIds = array_values($publicIds);
                $report->save();
            } else {
                if ($request->attachmentPublicId) {
                    $this->cloudinary->deleteImage($request->attachmentPublicId);
                }
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function uploadForNewReport(Request $request)
    {
        try {
            $request->validate(['attachments.*' => 'required|file|mimes:jpg,jpeg,png,gif,webp,pdf|max:5120']);

            $uploadedUrls = [];
            $uploadedPublicIds = [];

            foreach ($request->file('attachments') as $file) {
                $result = $this->cloudinary->getCloudinary()->uploadApi()->upload($file->getRealPath(), ['folder' => 'reports_attachments', 'resource_type' => 'auto']);
                $uploadedUrls[] = $result['secure_url'];
                $uploadedPublicIds[] = $result['public_id'];
            }

            session()->put('temp_uploads', ['urls' => $uploadedUrls, 'publicIds' => $uploadedPublicIds, 'timestamp' => now()]);

            return response()->json(['success' => true, 'urls' => $uploadedUrls, 'publicIds' => $uploadedPublicIds]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
