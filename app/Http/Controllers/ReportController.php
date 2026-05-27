<?php

namespace App\Http\Controllers;

use App\Services\CloudinaryService;
use App\Models\Report;
use App\Models\Student;
use App\Models\Officer;
use App\Models\UnregisteredReporter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Http;

class ReportController extends Controller
{
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
    }

    // === NEW AI FEATURE: Hugging Face categorization ===
    private function aiCategorizeReport($description)
    {
        try {
            $apiKey = env('HUGGINGFACE_API_KEY', '');

            if (!$apiKey) {
                \Log::warning('Hugging Face API key not set');
                return null;
            }

            $categories = [
                'theft' => 'theft, robbery, stealing, stolen property, stolen items, stealing laptop, stealing phone, stolen wallet, stolen bag, taking something without permission',
                'harassment' => 'harassment, bullying, verbal abuse, intimidation, threatening, sexual harassment, inappropriate behavior, stalking',
                'vandalism' => 'vandalism, property damage, graffiti, broken, destruction, smashed, destroyed, ruined, messed up',
                'fireHazard' => 'fire hazard, fire, smoke, burning, flammable, explosion, fire alarm, gas leak',
                'suspiciousActivity' => 'suspicious activity, strange behavior, lurking, following, acting weird, unknown person',
                'facilityIssue' => 'facility issue, maintenance, broken equipment, lights out, leak, water leak, broken pipe, elevator not working',
                'wildAnimal' => 'wild animal, snake, stray dog, animal threat, monkey, dangerous animal, animal bite',
                'trespassing' => 'trespassing, unauthorized entry, breaking in, intrusion, breaking into, entered without permission',
                'emergency_alert' => 'emergency, danger, immediate threat, help needed, urgent, critical',
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

            \Log::info('Hugging Face API response status: ' . $response->status());

            if ($response->successful()) {
                $result = $response->json();
                $scores = $result['scores'] ?? [];
                $labels = $result['labels'] ?? [];

                \Log::info('AI scores:', array_combine($labels, $scores));

                if (!empty($labels) && !empty($scores)) {
                    $bestMatch = $labels[array_search(max($scores), $scores)];
                    $bestScore = max($scores);

                    \Log::info('AI categorization result: ' . $bestMatch . ' with score: ' . $bestScore);

                    if ($bestScore > 0.3) {
                        return $bestMatch;
                    }
                }
            } else {
                \Log::warning('Hugging Face API error: ' . $response->body());
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

        // Expanded keyword maps with more variations and common phrases
        $keywordMap = [
            'theft' => [
                'stole', 'steal', 'stolen', 'theft', 'robbery', 'rob', 'robber', 'thief', 'thieves',
                'pickpocket', 'snatch', 'swipe', 'took', 'taken', 'missing', 'vanished', 'disappeared',
                'laptop', 'phone', 'wallet', 'bag', 'money', 'cash', 'purse', 'backpack', 'handbag',
                'bicycle', 'bike', 'motorcycle', 'car', 'jewelry', 'watch', 'tablet', 'ipad',
                'headphones', 'charger', 'keys', 'credit card', 'debit card', 'id card',
                'passport', 'documents', 'textbook', 'calculator', 'camera', 'smartwatch',
                'broke into', 'broke in', 'forced entry', 'took without permission', 'unauthorized taking',
                'stole my', 'stole from', 'took my', 'took from', 'grabbed', 'pulled', 'snatched',
                'lifted', 'pinched', 'nabbed', 'swiped',
                'my phone is gone', 'my wallet is missing', 'someone took', 'where is my', 'i can\'t find my'
            ],
            'harassment' => [
                'harass', 'harassment', 'harassing', 'bully', 'bullying', 'bullied', 'intimidate',
                'intimidation', 'threaten', 'threatening', 'threat', 'verbal abuse', 'insult',
                'insulting', 'name calling', 'taunt', 'taunting', 'mock', 'mocking', 'ridicule',
                'sexual harassment', 'catcall', 'catcalling', 'whistle', 'whistling', 'lewd',
                'inappropriate behavior', 'inappropriate comments', 'sexual comments', 'gesture',
                'explicit', 'harassed me', 'made me uncomfortable', 'unwanted attention',
                'stalking', 'stalk', 'followed', 'following me', 'creepy', 'creep',
                'pushed', 'shoved', 'grabbed', 'touched inappropriately', 'assault', 'groped',
                'gaslight', 'manipulate', 'manipulation', 'coerce', 'coercion', 'pressure',
                'pressured', 'intimidated me', 'scared me', 'frightened', 'terrified',
                'cyberbully', 'cyberbullying', 'online harassment', 'doxx', 'doxing', 'troll',
                'trolling', 'hate speech', 'slut shaming', 'body shaming'
            ],
            'vandalism' => [
                'vandal', 'vandalism', 'vandalized', 'vandalising', 'graffiti', 'tag', 'tagging',
                'damage', 'damaged', 'destroy', 'destroyed', 'destruction', 'smashed', 'shattered',
                'cracked', 'broken', 'broke', 'wrecked', 'ruined', 'dismantled', 'defaced',
                'property damage', 'criminal mischief', 'malicious mischief', 'tampered', 'tampering',
                'slashed', 'cut', 'ripped', 'torn', 'punctured', 'dented', 'scratched', 'keyed',
                'window broken', 'glass shattered', 'door damaged', 'lock broken', 'fence damaged',
                'car keyed', 'paint scratched', 'tyre slashed', 'tire slashed', 'graffiti sprayed',
                'wall painted', 'bench broken', 'sign damaged', 'light smashed', 'bins overturned',
                'threw rock', 'threw stone', 'threw brick', 'kicked', 'punched', 'hit with',
                'spray painted', 'drew on', 'wrote on', 'etched', 'carved',
                'bus stop', 'public property', 'school property', 'university property', 'facility'
            ],
            'fireHazard' => [
                'fire', 'smoke', 'burning', 'burn', 'burnt', 'burned', 'flame', 'flames',
                'blaze', 'inferno', 'combustion', 'ignite', 'ignited', 'ignition',
                'flammable', 'inflammable', 'combustible', 'gas leak', 'gasoline', 'petrol',
                'diesel', 'kerosene', 'propane', 'butane', 'methane', 'hydrogen',
                'short circuit', 'sparking', 'sparks', 'electrical fire', 'overheating',
                'overheated', 'melted wire', 'burning smell', 'smoke smell', 'electrical fault',
                'explosion', 'explosive', 'detonate', 'detonation', 'blast', 'bang', 'boom',
                'fire alarm', 'smoke detector', 'sprinkler', 'fire extinguisher',
                'kitchen fire', 'lab fire', 'chemical fire', 'forest fire', 'grass fire',
                'trash fire', 'dumpster fire', 'electrical panel', 'fuse box', 'power outlet',
                'fire hazard', 'safety hazard', 'dangerous', 'risk of fire', 'potential fire',
                'could cause fire', 'might ignite', 'unsafe wiring', 'faulty wiring'
            ],
            'suspiciousActivity' => [
                'suspicious', 'strange', 'weird', 'odd', 'unusual', 'peculiar', 'bizarre',
                'lurking', 'loitering', 'hanging around', 'prowling', 'skulking',
                'following', 'shadowing', 'trailing', 'tailing',
                'unknown person', 'stranger', 'unfamiliar', 'someone i don\'t know',
                'suspicious person', 'suspicious individual', 'suspicious character',
                'acting weird', 'acting strange', 'behaving oddly', 'suspicious behaviour',
                'suspicious behavior', 'suspicious activity', 'suspicious actions',
                'casing', 'scoping out', 'checking out', 'looking around', 'observing',
                'watching', 'peeking', 'peering', 'spying', 'eavesdropping',
                'binoculars', 'camera', 'recording', 'filming', 'taking pictures',
                'photographing', 'video recording', 'drone', 'unmanned aircraft',
                'suspicious vehicle', 'unmarked car', 'strange car', 'unknown car',
                'parked for long time', 'circling', 'driving slowly', 'stopped repeatedly',
                'testing doors', 'checking locks', 'looking through windows', 'peeking in windows',
                'trying to open', 'jiggling handle', 'tampering with lock', 'picking lock',
                'acting nervous', 'looking over shoulder', 'hiding', 'concealing', 'masked',
                'hood pulled up', 'face covered', 'wearing gloves', 'carrying tools'
            ],
            'facilityIssue' => [
                'maintenance', 'repair', 'broken', 'not working', 'malfunction', 'faulty',
                'damaged', 'defective', 'out of order', 'failing', 'failure',
                'light out', 'lights out', 'broken light', 'flickering light', 'flicker',
                'dim light', 'no light', 'dark hallway', 'dark stairwell', 'light not working',
                'street light', 'lamp post', 'ceiling light', 'fluorescent', 'bulb blown',
                'leak', 'leaking', 'water leak', 'pipe burst', 'broken pipe', 'dripping',
                'flood', 'flooding', 'water damage', 'wet floor', 'standing water',
                'clogged', 'blocked', 'toilet clogged', 'sink clogged', 'drain blocked',
                'no water', 'low water pressure', 'water heater', 'boiler', 'radiator',
                'air conditioner', 'ac not working', 'no cooling', 'no heating', 'heater broken',
                'fan not working', 'ventilation', 'air quality', 'stuffy', 'too hot', 'too cold',
                'elevator', 'lift', 'escalator', 'stuck', 'trapped', 'not moving', 'door stuck',
                'elevator broken', 'lift broken', 'escalator broken', 'not functioning',
                'door stuck', 'door jammed', 'door won\'t open', 'door won\'t close', 'broken door',
                'window stuck', 'broken window', 'cracked window', 'window won\'t close',
                'broken chair', 'broken table', 'broken desk', 'damaged furniture',
                'loose railing', 'wobbly', 'unstable', 'collapsed',
                'cracked wall', 'cracked floor', 'hole in wall', 'hole in floor', 'ceiling leak',
                'falling ceiling', 'loose tile', 'broken tile', 'uneven floor',
                'slippery floor', 'wet floor', 'hazard', 'trip hazard', 'uneven pavement',
                'pothole', 'cracked pavement', 'broken pavement'
            ],
            'wildAnimal' => [
                'snake', 'serpent', 'python', 'cobra', 'viper', 'reptile',
                'stray dog', 'wild dog', 'feral dog', 'aggressive dog', 'barking dog',
                'monkey', 'macaque', 'primate', 'ape', 'baboon',
                'wild boar', 'pig', 'feral pig', 'boar',
                'cat', 'stray cat', 'feral cat',
                'bat', 'flying fox', 'rodent', 'rat', 'mouse', 'squirrel',
                'insect', 'wasp', 'bee', 'hornet', 'ant', 'caterpillar', 'centipede',
                'lizard', 'gecko', 'iguana', 'chameleon',
                'attack', 'attacked', 'bites', 'bit', 'bitten', 'chase', 'chased', 'charging',
                'aggressive', 'dangerous', 'threatening', 'lunged', 'snapped',
                'wildlife', 'animal in building', 'animal on campus', 'animal sighting',
                'creature', 'beast', 'pest', 'infestation',
                'rabid', 'foaming', 'aggressive behavior', 'territorial', 'protecting young',
                'cornered', 'trapped', 'stalking'
            ],
            'trespassing' => [
                'trespassing', 'trespass', 'trespassed', 'unauthorized entry', 'unauthorized access',
                'breaking in', 'broke in', 'forced entry', 'break in', 'break-in',
                'intrusion', 'intruder', 'invader', 'infiltrator', 'squatter',
                'entered without permission', 'came in without permission', 'let themselves in',
                'climbed fence', 'jumped fence', 'hopped fence', 'cut fence', 'broke fence',
                'opened locked door', 'picked lock', 'used key', 'duplicate key',
                'window entry', 'climbed through window', 'broke window', 'entered through',
                'restricted area', 'authorized personnel only', 'private property',
                'no entry', 'do not enter', 'keep out', 'off limits', 'prohibited area',
                'found in', 'discovered in', 'caught in', 'seen in', 'spotted in',
                'sneaking', 'sneaked', 'creeping', 'crawling', 'hiding', 'concealed',
                'no right to be', 'not supposed to be', 'should not be', 'without authorization',
                'without permission', 'not authorized', 'uninvited'
            ],
            'emergency_alert' => [
                'emergency', 'danger', 'immediate threat', 'urgent', 'critical',
                'life threatening', 'medical emergency', 'heart attack', 'stroke',
                'seizure', 'unconscious', 'passed out', 'fainted', 'collapsed',
                'bleeding', 'blood', 'severe bleeding', 'hemorrhage', 'wound',
                'injury', 'injured', 'hurt badly', 'serious injury',
                'fight', 'brawl', 'altercation', 'physical altercation', 'assault',
                'attack', 'attacked', 'beating', 'hit', 'punched', 'kicked', 'struck',
                'weapon', 'gun', 'knife', 'blade', 'firearm', 'pistol', 'rifle', 'shotgun',
                'stabbing', 'stabbings', 'stabbed', 'shooting', 'shot',
                'hostage', 'kidnapping', 'abduction', 'held against will',
                'violent', 'violence', 'aggressive', 'dangerous person',
                'help', 'call ambulance', 'need medical', 'need police', 'need rescue',
                'trapped', 'stuck', 'cannot get out', 'emergency services',
                'active shooter', 'bomb threat', 'explosive device', 'suspicious package',
                'chemical spill', 'hazmat', 'hazardous material', 'gas leak emergency'
            ]
        ];

        $scores = [];
        foreach ($keywordMap as $category => $keywords) {
            $score = 0;
            foreach ($keywords as $keyword) {
                $occurrences = substr_count($descLower, $keyword);
                if ($occurrences > 0) {
                    $score += $occurrences;
                }
            }
            if ($score > 0) {
                $scores[$category] = $score;
                \Log::info("Category '{$category}' scored: {$score}");
            }
        }

        $phrases = [
            'theft' => ['my phone', 'my wallet', 'my bag', 'my laptop', 'my money', 'stole my'],
            'harassment' => ['made me feel', 'uncomfortable', 'inappropriate'],
            'vandalism' => ['broken glass', 'spray paint', 'property damage'],
            'fireHazard' => ['smell of smoke', 'electrical burning', 'gas smell', 'fire risk'],
            'suspiciousActivity' => ['doesnt belong', 'shouldnt be here', 'out of place'],
            'facilityIssue' => ['not functioning', 'in disrepair', 'falling apart'],
            'wildAnimal' => ['dangerous animal', 'attack animal', 'wildlife sighting'],
            'trespassing' => ['doesnt belong here', 'no right to be here', 'unauthorized presence'],
            'emergency_alert' => ['call for help', 'medical assistance', 'need immediate assistance']
        ];

        foreach ($phrases as $category => $phraseList) {
            $score = 0;
            foreach ($phraseList as $phrase) {
                $occurrences = substr_count($descLower, $phrase);
                if ($occurrences > 0) {
                    $score += $occurrences * 2;
                }
            }
            if ($score > 0) {
                $scores[$category] = ($scores[$category] ?? 0) + $score;
                \Log::info("Category '{$category}' additional phrase score: {$score}");
            }
        }

        if (!empty($scores)) {
            $bestCategory = array_keys($scores, max($scores))[0];
            \Log::info('Keyword categorization result: ' . $bestCategory . ' with total score: ' . $scores[$bestCategory]);
            return $bestCategory;
        }

        return 'other';
    }

    private function aiDetectUrgency($description, $category = null)
    {
        $urgentKeywords = [
            'fire', 'emergency', 'injured', 'bleeding', 'attack', 'assault',
            'weapon', 'danger', 'immediate', 'urgent', 'threat', 'violence',
            'hurt', 'unconscious', 'bleeding', 'blood', 'fight', 'crash'
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

    public function analyzeWithAI(Request $request)
    {
        $description = $request->input('description');

        if (!$description) {
            return response()->json(['success' => false, 'error' => 'No description provided']);
        }

        $category = $this->aiCategorizeReport($description);

        if (!$category || $category === 'other') {
            $category = $this->keywordCategorizeReport($description);
            \Log::info('Using keyword fallback for category: ' . $category);
        }

        $urgency = $this->aiDetectUrgency($description, $category);

        $confidence = 0.5;
        if ($category && $category !== 'other') {
            $confidence = 0.85;
        } elseif ($category === 'other') {
            $confidence = 0.35;
        }

        return response()->json([
            'success' => true,
            'category' => $category ?? 'other',
            'urgency' => $urgency,
            'confidence' => $confidence
        ]);
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
        if ($locations = $request->get('locations')) {
            $locationArray = explode(',', $locations);
            $query->where(function ($q) use ($locationArray) {
                foreach ($locationArray as $location) {
                    $q->orWhere('mahallah', 'like', "%$location%")
                    ->orWhere('location.building', 'like', "%$location%")
                    ->orWhere('location.address', 'like', "%$location%");
                }
            });
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

        // Add student names and officer names to reports
        $reports->getCollection()->transform(function ($report) use ($students, $officers) {
            $studentId = (string)$report->studentId;

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

            // ============================================================
            // SEND TELEGRAM NOTIFICATION WHEN OFFICER IS ASSIGNED
            // ============================================================
            $newAssignedOfficer = $report->assignedOfficer;

            // Check if officer was JUST assigned (changed from null/empty to a value)
            $wasAssignedNow = ($oldAssignedOfficer !== $newAssignedOfficer) && !empty($newAssignedOfficer);

            if ($wasAssignedNow) {
                try {
                    // Find the assigned officer
                    $assignedOfficer = Officer::where('officerId', $newAssignedOfficer)->first();

                    if ($assignedOfficer && $assignedOfficer->telegram_chat_id && $assignedOfficer->receive_emergency) {
                        \Log::info('Sending Telegram notification to assigned officer for report: ' . $report->reportId);

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
                        } elseif ($report->studentId) {
                            $student = Student::find($report->studentId);
                            if ($student) {
                                $reporterName = $student->name;
                                $reporterContact = $student->phone;
                                $reporterMatric = $student->matrixNumber;
                            }
                        }

                        // Build location string
                        $location = $report->getFullAddress();

                        // Format date and time
                        $dateTime = $report->incidentDateTime ? new \DateTime($report->incidentDateTime) : null;
                        $dateFormatted = $dateTime ? $dateTime->format('d/m/Y') : 'Unknown';
                        $timeFormatted = $dateTime ? $dateTime->format('H:i') : '';

                        $message = "📋 *REPORT ASSIGNED TO YOU* 📋\n\n";
                        $message .= "*{$assignedOfficer->officerName}*, you have been assigned to a report.\n\n";
                        $message .= "*Report ID:* `{$report->reportId}`\n";
                        $message .= "*Reporter:* {$reporterName}\n";
                        if ($reporterMatric) {
                            $message .= "*Matrix:* {$reporterMatric}\n";
                        }
                        if ($reporterContact) {
                            $message .= "*Phone:* {$reporterContact}\n";
                        }
                        $message .= "*Category:* " . ($this->getCategoryLabel($report->incidentCategory) ?? $report->incidentCategory) . "\n";
                        $message .= "*Location:* {$location}\n";
                        $message .= "*Date:* {$dateFormatted}\n";
                        if ($timeFormatted) {
                            $message .= "*Time:* {$timeFormatted}\n";
                        }
                        $message .= "*Urgency:* " . (($report->urgency === 'urgent') ? '🚨 URGENT' : 'General') . "\n\n";
                        $message .= "📋 *Your Task:*\n";
                        $message .= "• Review the report details\n";
                        $message .= "• Investigate the incident\n";
                        $message .= "• Follow up with the reporter if needed\n";
                        $message .= "• Update the status when resolved\n\n";
                        $message .= "*Description:* " . (strlen($report->description) > 200 ? substr($report->description, 0, 200) . '...' : $report->description);

                        $this->sendTelegramMessage($assignedOfficer->telegram_chat_id, $message);
                    } else {
                        \Log::warning('Assigned officer not found or has no Telegram for report: ' . $report->reportId);
                    }
                } catch (\Exception $e) {
                    \Log::error('Failed to send Telegram notification for report assignment: ' . $e->getMessage());
                }
            }

            // ============================================================
            // NEW: SEND TELEGRAM NOTIFICATION WHEN REPORT IS RESOLVED
            // ============================================================
            $wasResolvedNow = ($oldStatus !== $report->status) && $report->status === 'resolved';

            if ($wasResolvedNow) {
                try {
                    // Find the assigned officer (if any)
                    $assignedOfficer = null;
                    if ($report->assignedOfficer) {
                        $assignedOfficer = Officer::where('officerId', $report->assignedOfficer)->first();
                    }

                    if ($assignedOfficer && $assignedOfficer->telegram_chat_id && $assignedOfficer->receive_emergency) {
                        \Log::info('Sending Telegram resolution notification to assigned officer for report: ' . $report->reportId);

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
                        } elseif ($report->studentId) {
                            $student = Student::find($report->studentId);
                            if ($student) {
                                $reporterName = $student->name;
                                $reporterContact = $student->phone;
                                $reporterMatric = $student->matrixNumber;
                            }
                        }

                        // Build location string
                        $location = $report->getFullAddress();

                        $message = "✅ *REPORT RESOLVED* ✅\n\n";
                        $message .= "*{$assignedOfficer->officerName}*, you have resolved a report.\n\n";
                        $message .= "*Report ID:* `{$report->reportId}`\n";
                        $message .= "*Reporter:* {$reporterName}\n";
                        if ($reporterMatric) {
                            $message .= "*Matrix:* {$reporterMatric}\n";
                        }
                        if ($reporterContact) {
                            $message .= "*Phone:* {$reporterContact}\n";
                        }
                        $message .= "*Category:* " . ($this->getCategoryLabel($report->incidentCategory) ?? $report->incidentCategory) . "\n";
                        $message .= "*Location:* {$location}\n";
                        $message .= "*Resolved at:* " . now()->format('d/m/Y H:i:s') . "\n\n";
                        $message .= "👍 *Good work!* The report has been successfully resolved.\n";
                        $message .= "The reporter has been notified of the resolution.";

                        $this->sendTelegramMessage($assignedOfficer->telegram_chat_id, $message);
                    } else {
                        \Log::info('No assigned officer found with Telegram for report resolution: ' . $report->reportId);
                    }
                } catch (\Exception $e) {
                    \Log::error('Failed to send Telegram resolution notification: ' . $e->getMessage());
                }
            }

            // Send status change notification to mobile (keep existing)
            if ($oldStatus !== $report->status) {
                try {
                    $statusLabels = [
                        'pending' => 'Pending',
                        'in_progress' => 'In Progress',
                        'resolved' => 'Resolved',
                        'nfa' => 'No Further Action'
                    ];

                    $nodeServerUrl = env('NODE_SERVER_URL', 'http://localhost:3000');

                    Http::post($nodeServerUrl . '/api/notify-status-change', [
                        'reportId' => $report->reportId,
                        'studentId' => (string)$report->studentId,
                        'oldStatus' => $oldStatus,
                        'newStatus' => $report->status,
                        'title' => 'Report Status Updated',
                        'message' => "Your report #{$report->reportId} status changed from " .
                                    ($statusLabels[$oldStatus] ?? $oldStatus) . " to " .
                                    ($statusLabels[$report->status] ?? $report->status)
                    ]);

                    \Log::info('Mobile notification sent for report: ' . $report->reportId);
                } catch (\Exception $e) {
                    \Log::error('Failed to notify mobile server: ' . $e->getMessage());
                }
            }

            \Log::info('Report updated successfully', ['reportId' => $reportId]);

            return redirect()->back()->with('success', 'Report updated successfully.');

        } catch (\Exception $e) {
            \Log::error('Update failed: ' . $e->getMessage(), [
                'reportId' => $reportId,
                'trace' => $e->getTraceAsString()
            ]);

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
                $attachments[] = [
                    'original' => $url,
                    'thumbnail' => $url,
                    'medium' => $url,
                    'large' => $url,
                    'public_id' => null,
                ];
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

        return Inertia::render('Reports/Show', [
            'report' => $report,
        ]);
    }

    public function uploadAttachments(Request $request)
    {
        try {
            \Log::info('Upload attachments started', [
                'report_id' => $request->reportId,
                'files_count' => count($request->file('attachments', []))
            ]);

            $request->validate([
                'attachments.*' => 'required|file|mimes:jpg,jpeg,png,gif,webp,pdf|max:5120',
                'reportId' => 'required|string',
            ]);

            $report = Report::where('reportId', $request->reportId)->first();

            if (!$report) {
                return response()->json([
                    'success' => false,
                    'error' => 'Report not found'
                ], 404);
            }

            $uploadedUrls = [];
            $uploadedPublicIds = [];

            foreach ($request->file('attachments') as $file) {
                try {
                    $result = $this->cloudinary->getCloudinary()->uploadApi()->upload(
                        $file->getRealPath(),
                        [
                            'folder' => 'reports_attachments',
                            'resource_type' => 'auto',
                        ]
                    );

                    $uploadedUrls[] = $result['secure_url'];
                    $uploadedPublicIds[] = $result['public_id'];

                } catch (\Exception $e) {
                    \Log::error('Cloudinary upload error: ' . $e->getMessage());
                    return response()->json([
                        'success' => false,
                        'error' => 'Failed to upload file: ' . $e->getMessage()
                    ], 500);
                }
            }

            $existingAttachments = $report->attachmentUrls ?? [];
            $existingPublicIds = $report->attachmentPublicIds ?? [];

            $report->attachmentUrls = array_merge($existingAttachments, $uploadedUrls);
            $report->attachmentPublicIds = array_merge($existingPublicIds, $uploadedPublicIds);
            $report->save();

            \Log::info('Attachments saved to report', [
                'report_id' => $request->reportId,
                'new_count' => count($uploadedUrls),
                'total_count' => count($report->attachmentUrls)
            ]);

            return response()->json([
                'success' => true,
                'urls' => $uploadedUrls,
                'publicIds' => $uploadedPublicIds,
                'message' => 'Files uploaded successfully'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Upload attachments error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Server error: ' . $e->getMessage()
            ], 500);
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

            \Log::info('Delete attachment called', [
                'reportId' => $request->reportId,
                'attachmentUrl' => $request->attachmentUrl,
                'attachmentPublicId' => $request->attachmentPublicId
            ]);

            if ($request->reportId) {
                $report = Report::where('reportId', $request->reportId)->firstOrFail();

                $attachments = $report->attachmentUrls ?? [];
                $publicIds = $report->attachmentPublicIds ?? [];

                $index = array_search($request->attachmentUrl, $attachments);

                if ($index !== false) {
                    if (isset($publicIds[$index])) {
                        try {
                            $result = $this->cloudinary->deleteImage($publicIds[$index]);
                            \Log::info('Deleted from Cloudinary', [
                                'public_id' => $publicIds[$index],
                                'result' => $result
                            ]);
                        } catch (\Exception $e) {
                            \Log::error('Failed to delete from Cloudinary: ' . $e->getMessage());
                        }
                        unset($publicIds[$index]);
                    }
                    unset($attachments[$index]);
                }

                $report->attachmentUrls = array_values($attachments);
                $report->attachmentPublicIds = array_values($publicIds);
                $report->save();

            } else {
                if ($request->attachmentPublicId) {
                    $result = $this->cloudinary->deleteImage($request->attachmentPublicId);
                    \Log::info('Deleted from Cloudinary (new report)', [
                        'public_id' => $request->attachmentPublicId,
                        'result' => $result
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Attachment deleted successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Delete attachment error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to delete attachment: ' . $e->getMessage()
            ], 500);
        }
    }

    public function uploadForNewReport(Request $request)
    {
        try {
            $request->validate([
                'attachments.*' => 'required|file|mimes:jpg,jpeg,png,gif,webp,pdf|max:5120',
            ]);

            $uploadedUrls = [];
            $uploadedPublicIds = [];

            foreach ($request->file('attachments') as $file) {
                $result = $this->cloudinary->getCloudinary()->uploadApi()->upload(
                    $file->getRealPath(),
                    [
                        'folder' => 'reports_attachments',
                        'resource_type' => 'auto',
                    ]
                );

                $uploadedUrls[] = $result['secure_url'];
                $uploadedPublicIds[] = $result['public_id'];
            }

            session()->put('temp_uploads', [
                'urls' => $uploadedUrls,
                'publicIds' => $uploadedPublicIds,
                'timestamp' => now()
            ]);

            return response()->json([
                'success' => true,
                'urls' => $uploadedUrls,
                'publicIds' => $uploadedPublicIds,
                'message' => 'Files uploaded successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
