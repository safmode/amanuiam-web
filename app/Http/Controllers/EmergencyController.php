<?php

namespace App\Http\Controllers;

use App\Models\Emergencies;
use App\Models\Student;
use App\Models\Officer;
use App\Http\Controllers\NotificationController;
use App\Traits\LocationMatchingTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class EmergencyController extends Controller
{
    use LocationMatchingTrait;

    public function __construct()
    {
        $this->initLocationMatching();
    }

    // Helper function to send Telegram messages directly
    private function sendTelegramMessage($chatId, $message)
    {
        $token = env('TELEGRAM_BOT_TOKEN');

        if (!$token) {
            Log::error('TELEGRAM_BOT_TOKEN not set');
            return false;
        }

        if (!$chatId) {
            Log::warning('No chat ID provided');
            return false;
        }

        try {
            $response = Http::timeout(10)->post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'Markdown'
            ]);

            if ($response->successful()) {
                Log::info('Telegram message sent', ['chat_id' => $chatId]);
                return true;
            } else {
                Log::error('Telegram API error', ['response' => $response->body()]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error('Telegram send error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Store a new emergency alert (called from mobile app)
     */
    public function store(Request $request)
    {
        try {
            Log::info('Emergency store method called', $request->all());

            $validated = $request->validate([
                'studentId' => 'required|string',
                'latitude' => 'required|numeric',
                'longitude' => 'required|numeric',
                'address' => 'nullable|string',
                'location' => 'nullable|array',
            ]);

            $student = Student::find($validated['studentId']);
            if (!$student) {
                $student = new \stdClass();
                $student->name = 'Unknown Student';
                $student->matrixNumber = 'N/A';
                $student->phone = 'N/A';
                $student->email = 'N/A';
            }

            $emergency = Emergencies::create([
                'studentId' => $validated['studentId'],
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'address' => $validated['address'] ?? null,
                'location' => $validated['location'] ?? null,
                'status' => 'active',
                'triggeredAt' => now(),
            ]);

            Log::info('Emergency alert created', [
                'emergency_id' => (string)$emergency->_id,
                'student_id' => $validated['studentId']
            ]);

            NotificationController::createEmergencyAlert($emergency, $student);

            // ✅ SEND TELEGRAM NOTIFICATION TO ALL ELIGIBLE OFFICERS FOR NEW EMERGENCY
            try {
                $officers = Officer::where('receive_emergency', true)
                    ->whereNotNull('telegram_chat_id')
                    ->get();

                $studentName = $student->name ?? 'Unknown Student';
                $matrixNumber = $student->matrixNumber ?? 'N/A';
                $phone = $student->phone ?? 'N/A';
                $location = $validated['address'] ?? 'Unknown location';

                $message = "🚨 *EMERGENCY ALERT* 🚨\n\n";
                $message .= "*Student:* {$studentName}\n";
                $message .= "*Matrix:* {$matrixNumber}\n";
                $message .= "*Phone:* {$phone}\n";
                $message .= "*Location:* {$location}\n";
                $message .= "*Time:* " . now()->format('d/m/Y H:i:s') . "\n\n";
                $message .= "⚠️ *URGENT: Immediate action required!*\n\n";
                $message .= "Use `/myemergencies` to view active emergencies.\n";
                $message .= "Use `/resolve EMERGENCY_ID` to resolve.";

                $sentCount = 0;
                foreach ($officers as $officer) {
                    if ($this->sendTelegramMessage($officer->telegram_chat_id, $message)) {
                        $sentCount++;
                    }
                }
                Log::info("Telegram emergency alert sent to {$sentCount} officers");
            } catch (\Exception $e) {
                Log::error('Failed to send Telegram for new emergency: ' . $e->getMessage());
            }

            Log::info('Emergency created - Telegram notifications sent to officers');

            // Mobile notification via Node.js
            try {
                $nodeServerUrl = env('NODE_SERVER_URL', 'http://localhost:3000');
                Http::timeout(5)->post($nodeServerUrl . '/api/notify-emergency-status', [
                    'emergencyId' => (string)$emergency->_id,
                    'studentId' => $validated['studentId'],
                    'oldStatus' => null,
                    'newStatus' => 'active',
                    'title' => '🚨 EMERGENCY ALERT',
                    'message' => "Emergency alert triggered at " . ($validated['address'] ?? 'your location')
                ]);
            } catch (\Exception $e) {
                Log::error('Mobile notification failed: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'emergency' => $emergency]);

        } catch (\Exception $e) {
            Log::error('Failed to store emergency: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get all emergencies with pagination - WITH LOCATION MATCHING
     * This returns JSON for API calls, not Inertia responses
     */
    public function index(Request $request)
    {
        try {
            $perPage = (int) $request->get('per_page', 15);
            $page = (int) $request->get('page', 1);
            $status = $request->get('status');
            $locations = $request->get('locations');

            // Build query with eager loading and indexing
            $query = Emergencies::orderBy('triggeredAt', 'desc');

            // Apply status filter if provided (comma-separated or single)
            if ($status) {
                $statuses = explode(',', $status);
                $query->whereIn('status', $statuses);
            }

            // OPTIMIZATION: Select only needed fields to reduce data transfer
            $query->select([
                '_id', 'studentId', 'status', 'triggeredAt', 'address', 'location',
                'assigned_officer_id', 'assigned_officer_name', 'dispatch_notes',
                'dispatched_at', 'resolvedAt', 'latitude', 'longitude'
            ]);

            // Execute paginated query
            $emergencies = $query->paginate($perPage, ['*'], 'page', $page);

            // OPTIMIZATION: Batch load all students in ONE query instead of N queries
            $studentIds = [];
            foreach ($emergencies->items() as $emergency) {
                if ($emergency->studentId && !in_array($emergency->studentId, $studentIds)) {
                    $studentIds[] = $emergency->studentId;
                }
            }

            // Batch fetch students
            $students = [];
            if (!empty($studentIds)) {
                $studentCollection = Student::whereIn('_id', $studentIds)->get();
                foreach ($studentCollection as $student) {
                    $students[(string)$student->_id] = $student;
                }
            }

            // Transform results with batched student data
            $emergencies->getCollection()->transform(function ($emergency) use ($students) {
                // Attach student data from batch-loaded collection
                if ($emergency->studentId && isset($students[(string)$emergency->studentId])) {
                    $student = $students[(string)$emergency->studentId];
                    $emergency->reporterName = $student->name;
                    $emergency->reporterPhone = $student->phone;
                    $emergency->reporterEmail = $student->email;
                    $emergency->reporterMatric = $student->matrixNumber;
                    $emergency->student = $student;
                } else {
                    $emergency->reporterName = 'Unknown Student';
                    $emergency->reporterPhone = null;
                    $emergency->reporterEmail = null;
                    $emergency->reporterMatric = null;
                    $emergency->student = null;
                }

                // Ensure fields exist
                $emergency->assigned_officer_id = $emergency->assigned_officer_id ?? null;
                $emergency->assigned_officer_name = $emergency->assigned_officer_name ?? null;
                $emergency->dispatch_notes = $emergency->dispatch_notes ?? null;
                $emergency->dispatched_at = $emergency->dispatched_at ?? null;

                // Determine location from address field
                $address = strtolower($emergency->address ?? '');
                $determinedLocation = null;

                $locationMap = [
                    'aminah' => 'Aminah',
                    'asiah' => 'Asiah',
                    'safiyyah' => 'Safiyyah',
                    'maryam' => 'Maryam',
                    'ruqayyah' => 'Ruqayyah',
                    'ali' => 'Ali',
                    'faruq' => 'Faruq',
                    'bilal' => 'Bilal',
                    'asma' => 'Asma',
                    'hafsah' => 'Hafsah',
                    'halimah' => 'Halimah',
                    'siddiq' => 'Siddiq',
                    'salahuddin' => 'Salahuddin',
                    'uthman' => 'Uthman',
                    'nusaibah' => 'Nusaibah',
                    'zubair' => 'Zubair Al-Awwam',
                    'sumayyah' => 'Sumayyah',
                    'kirkhs' => 'KIRKHS',
                    'kict' => 'KICT',
                    'koe' => 'KOE',
                    'kaed' => 'KAED',
                    'kenms' => 'KENMS',
                    'aikol' => 'AIKOL',
                    'koed' => 'KOED',
                    'library' => 'Dar al-Hikmah Library',
                    'stadium' => 'Saidina Hamzah Stadium',
                    'archery' => 'IIUM Archery Range',
                    'football' => 'UIA Football Turf',
                    'cricket' => 'IIUM Cricket Ground',
                    'rugby' => 'IIUM Rugby Field',
                    'educare' => 'IIUM Educare',
                    'mosque' => 'Sultan Haji Ahmad Shah Mosque',
                    'engineering' => 'KOE',
                ];

                foreach ($locationMap as $keyword => $locationKey) {
                    if (strpos($address, $keyword) !== false) {
                        $determinedLocation = $locationKey;
                        break;
                    }
                }

                if (!$determinedLocation && preg_match('/mahallah\s+(\w+)/i', $address, $matches)) {
                    $determinedLocation = ucfirst(strtolower($matches[1]));
                }

                $emergency->determined_location = $determinedLocation;

                // Remove large fields that aren't needed for list view
                unset($emergency->location);

                return $emergency;
            });

            // Apply location filter if provided
            if ($locations) {
                $locationArray = explode(',', $locations);
                $filteredItems = $emergencies->getCollection()->filter(function ($emergency) use ($locationArray) {
                    return in_array($emergency->determined_location, $locationArray);
                });
                $emergencies->setCollection($filteredItems);
                $totalItems = $filteredItems->count();
                $emergencies->total = $totalItems;
                $emergencies->lastPage = ceil($totalItems / $perPage);
            }

            return response()->json([
                'success' => true,
                'data' => $emergencies->items(),
                'pagination' => [
                    'current_page' => $emergencies->currentPage(),
                    'per_page' => $emergencies->perPage(),
                    'total' => $emergencies->total(),
                    'last_page' => $emergencies->lastPage(),
                    'from' => $emergencies->firstItem(),
                    'to' => $emergencies->lastItem(),
                    'next_page_url' => $emergencies->nextPageUrl(),
                    'prev_page_url' => $emergencies->previousPageUrl(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch emergencies: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to fetch emergencies'], 500);
        }
    }

    /**
     * Get emergency counts - CACHED VERSION
     */
    public function getActiveCount()
    {
        try {
            $cacheKey = 'emergency_counts';

            $counts = cache()->remember($cacheKey, 30, function () {
                return [
                    'active' => Emergencies::where('status', 'active')->count(),
                    'responding' => Emergencies::where('status', 'responding')->count(),
                    'resolved' => Emergencies::where('status', 'resolved')->count(),
                    'total' => Emergencies::count()
                ];
            });

            return response()->json($counts);
        } catch (\Exception $e) {
            Log::error('Failed to get emergency counts: ' . $e->getMessage());
            return response()->json(['active' => 0, 'responding' => 0, 'resolved' => 0, 'total' => 0]);
        }
    }

    /**
     * Get single emergency by ID
     * Returns JSON for API calls
     */
    public function show($id)
    {
        try {
            $emergency = Emergencies::find($id);

            if (!$emergency) {
                return response()->json(['success' => false, 'error' => 'Emergency not found'], 404);
            }

            if ($emergency->studentId) {
                $student = Student::find($emergency->studentId);
                if ($student) {
                    $emergency->reporterName = $student->name;
                    $emergency->reporterPhone = $student->phone;
                    $emergency->reporterEmail = $student->email;
                    $emergency->reporterMatric = $student->matrixNumber;
                    $emergency->student = $student;
                } else {
                    $emergency->reporterName = 'Unknown Student';
                    $emergency->reporterPhone = null;
                    $emergency->reporterEmail = null;
                    $emergency->reporterMatric = null;
                    $emergency->student = null;
                }
            } else {
                $emergency->reporterName = 'Unknown Student';
                $emergency->reporterPhone = null;
                $emergency->reporterEmail = null;
                $emergency->reporterMatric = null;
                $emergency->student = null;
            }

            // Determine location from address
            $address = strtolower($emergency->address ?? '');
            $determinedLocation = null;
            $locationMap = [
                'aminah' => 'Aminah', 'asiah' => 'Asiah', 'safiyyah' => 'Safiyyah',
                'maryam' => 'Maryam', 'ruqayyah' => 'Ruqayyah', 'koe' => 'KOE',
                'kict' => 'KICT', 'kirkhs' => 'KIRKHS', 'library' => 'Dar al-Hikmah Library',
            ];
            foreach ($locationMap as $keyword => $locationKey) {
                if (strpos($address, $keyword) !== false) {
                    $determinedLocation = $locationKey;
                    break;
                }
            }
            $emergency->determined_location = $determinedLocation;

            return response()->json(['success' => true, 'data' => $emergency]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch emergency: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to fetch emergency'], 500);
        }
    }

    /**
     * Dispatch an officer to an emergency
     * Returns JSON for API calls, or redirect for Inertia
     */
    public function dispatch(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'officerId' => 'required|string',
                'officerName' => 'required|string',
                'dispatchNotes' => 'nullable|string'
            ]);

            $emergency = Emergencies::find($id);
            if (!$emergency) {
                if ($request->header('X-Inertia')) {
                    return redirect()->back()->with('error', 'Emergency not found');
                }
                return response()->json(['success' => false, 'error' => 'Emergency not found'], 404);
            }

            // Update emergency
            $emergency->status = 'responding';
            $emergency->assigned_officer_id = $validated['officerId'];
            $emergency->assigned_officer_name = $validated['officerName'];
            $emergency->dispatch_notes = $validated['dispatchNotes'] ?? null;
            $emergency->dispatched_at = now();
            $emergency->save();

            // Clear cache
            cache()->forget('emergency_counts');

            // ✅ SEND TELEGRAM NOTIFICATION TO THE ASSIGNED OFFICER ONLY
            try {
                $assignedOfficer = Officer::where('officerId', $validated['officerId'])->first();

                if ($assignedOfficer && $assignedOfficer->telegram_chat_id && $assignedOfficer->receive_emergency) {
                    $student = Student::find($emergency->studentId);
                    $studentName = $student ? $student->name : 'Unknown Student';
                    $matrixNumber = $student ? $student->matrixNumber : 'N/A';
                    $phone = $student ? $student->phone : 'N/A';

                    $message = "👮 *TASK ASSIGNED TO YOU* 👮\n\n";
                    $message .= "*{$assignedOfficer->officerName}*, you have been assigned to an emergency.\n\n";
                    $message .= "*Student:* {$studentName}\n";
                    $message .= "*Matrix:* {$matrixNumber}\n";
                    $message .= "*Phone:* {$phone}\n";
                    $message .= "*Location:* " . ($emergency->address ?? 'Unknown') . "\n";
                    $message .= "*Reported at:* " . ($emergency->triggeredAt instanceof \DateTime
                        ? $emergency->triggeredAt->format('d/m/Y H:i:s')
                        : date('d/m/Y H:i:s', strtotime($emergency->triggeredAt))) . "\n\n";
                    $message .= "📋 *Your Task:*\n";
                    $message .= "• Respond to the location immediately\n";
                    $message .= "• Assess the situation\n";
                    $message .= "• Provide assistance to the student\n";
                    $message .= "• Update the status when resolved\n\n";
                    $message .= "⚠️ *Please respond to this emergency as soon as possible!*\n\n";
                    $message .= "Use `/myemergencies` to view your active emergencies.\n";
                    $message .= "Use `/resolve` to mark as resolved when done.";

                    $this->sendTelegramMessage($assignedOfficer->telegram_chat_id, $message);
                    Log::info('Telegram dispatch notification sent to assigned officer: ' . $assignedOfficer->officerName);
                } else {
                    Log::info('Assigned officer has no Telegram or disabled notifications', [
                        'officer_id' => $validated['officerId'],
                        'has_chat_id' => isset($assignedOfficer->telegram_chat_id),
                        'receive_emergency' => $assignedOfficer->receive_emergency ?? false
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to send Telegram dispatch notification: ' . $e->getMessage());
            }

            // 🔥 FIX: Always return redirect for Inertia, JSON for API
            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', 'Officer dispatched successfully');
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('Failed to dispatch officer: ' . $e->getMessage());

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('error', 'Failed to dispatch officer: ' . $e->getMessage());
            }

            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Resolve an emergency
     * Returns JSON for API calls, or redirect for Inertia
     */
    public function resolve(Request $request, $id)
    {
        Log::info('Resolve method called for ID: ' . $id);

        try {
            $emergency = Emergencies::find($id);
            if (!$emergency) {
                Log::error('Emergency not found: ' . $id);
                if ($request->wantsJson() || $request->is('api/*')) {
                    return response()->json(['error' => 'Emergency not found', 'success' => false], 404);
                }
                return redirect()->back()->with('error', 'Emergency not found');
            }

            $oldStatus = $emergency->status;
            $studentId = (string)$emergency->studentId;
            $student = Student::find($studentId);

            if (!$student) {
                $student = new \stdClass();
                $student->name = 'Unknown Student';
            }

            $emergency->status = 'resolved';
            $emergency->resolvedAt = now();
            $emergency->save();

            // Clear cache for counts
            cache()->forget('emergency_counts');

            // Send Telegram notification ONLY to the assigned officer
            try {
                $assignedOfficer = null;
                if ($emergency->assigned_officer_id) {
                    $assignedOfficer = Officer::where('officerId', $emergency->assigned_officer_id)->first();
                }
                if (!$assignedOfficer && $emergency->assigned_officer_name) {
                    $assignedOfficer = Officer::where('officerName', $emergency->assigned_officer_name)->first();
                }

                if ($assignedOfficer && $assignedOfficer->telegram_chat_id && $assignedOfficer->receive_emergency) {
                    Log::info('Sending Telegram resolution notification to assigned officer only: ' . $assignedOfficer->officerName);

                    $message = "✅ *EMERGENCY RESOLVED* ✅\n\n";
                    $message .= "*Student:* " . ($student->name ?? 'Unknown') . "\n";
                    $message .= "*Status:* Emergency has been marked as resolved\n";
                    $message .= "*Time:* " . now()->format('d/m/Y H:i:s') . "\n\n";
                    $message .= "The situation has been handled. Good work, {$assignedOfficer->officerName}!";

                    $this->sendTelegramMessage($assignedOfficer->telegram_chat_id, $message);
                } else {
                    Log::info('No assigned officer found with Telegram for resolution notification');
                }
            } catch (\Exception $e) {
                Log::error('Failed to send Telegram resolution notification to assigned officer: ' . $e->getMessage());
            }

            // Send mobile notification
            try {
                $nodeServerUrl = env('NODE_SERVER_URL', 'http://localhost:3000');
                Http::timeout(5)->post($nodeServerUrl . '/api/notify-emergency-status', [
                    'emergencyId' => (string)$emergency->_id,
                    'studentId' => $studentId,
                    'oldStatus' => $oldStatus,
                    'newStatus' => 'resolved',
                    'title' => '✅ Emergency Resolved',
                    'message' => "Your emergency has been marked as resolved. If you need further assistance, please contact security."
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to notify mobile server for emergency resolution: ' . $e->getMessage());
            }

            // Check if this is an Inertia request or API request
            $isInertiaRequest = $request->header('X-Inertia') === 'true';
            if ($request->wantsJson() && !$isInertiaRequest) {
                return response()->json(['success' => true, 'emergency' => $emergency]);
            }

            // For Inertia requests, redirect back with success message
            return redirect()->back()->with('success', 'Emergency resolved successfully');

        } catch (\Exception $e) {
            Log::error('Failed to resolve emergency: ' . $e->getMessage());

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json(['success' => false, 'error' => 'Failed to resolve emergency: ' . $e->getMessage()], 500);
            }

            return redirect()->back()->with('error', 'Failed to resolve emergency: ' . $e->getMessage());
        }
    }

    /**
     * Delete an emergency record
     * Returns JSON for API calls, or redirect for Inertia
     */
    public function destroy(Request $request, $id)
    {
        Log::info('Delete method called for ID: ' . $id);

        try {
            $emergency = Emergencies::find($id);

            if (!$emergency) {
                Log::error('Emergency not found for deletion: ' . $id);
                // For Inertia requests, return back with error
                if (!$request->wantsJson() && !$request->is('api/*')) {
                    return redirect()->back()->with('error', 'Emergency not found');
                }
                return response()->json(['success' => false, 'error' => 'Emergency not found'], 404);
            }

            $studentId = (string)$emergency->studentId;
            $emergencyId = (string)$emergency->_id;
            $emergency->delete();

            // Clear cache for counts
            cache()->forget('emergency_counts');

            Log::info('Emergency deleted successfully', [
                'emergency_id' => $emergencyId,
                'student_id' => $studentId
            ]);

            try {
                $nodeServerUrl = env('NODE_SERVER_URL', 'http://localhost:3000');
                Http::post($nodeServerUrl . '/api/notify-emergency-deleted', [
                    'emergencyId' => $emergencyId,
                    'studentId' => $studentId,
                    'title' => '🗑️ Emergency Record Removed',
                    'message' => "Your emergency record has been removed from the system."
                ]);
            } catch (\Exception $e) {
                Log::warning('Failed to send deletion notification: ' . $e->getMessage());
            }

            // IMPORTANT FIX: Check for Inertia request properly
            // Inertia requests have a special header 'X-Inertia' = true
            $isInertiaRequest = $request->header('X-Inertia') === 'true';

            if ($request->wantsJson() && !$isInertiaRequest) {
                // This is a pure API JSON request
                return response()->json(['success' => true, 'message' => 'Emergency record deleted successfully']);
            }

            // For Inertia requests, ALWAYS return a redirect (Inertia will handle it)
            return redirect()->back()->with('success', 'Emergency record deleted successfully');

        } catch (\Exception $e) {
            Log::error('Failed to delete emergency: ' . $e->getMessage());

            $isInertiaRequest = $request->header('X-Inertia') === 'true';

            if ($request->wantsJson() && !$isInertiaRequest) {
                return response()->json(['success' => false, 'error' => 'Failed to delete emergency: ' . $e->getMessage()], 500);
            }

            return redirect()->back()->with('error', 'Failed to delete emergency: ' . $e->getMessage());
        }
    }

    /**
     * Bulk delete emergencies
     * Returns JSON for API calls, or redirect for Inertia
     */
    public function bulkDelete(Request $request)
    {
        Log::info('Bulk delete method called');

        try {
            $validated = $request->validate([
                'ids' => 'required|array',
                'ids.*' => 'required|string'
            ]);

            $deletedCount = 0;
            $failedIds = [];

            foreach ($validated['ids'] as $id) {
                $emergency = Emergencies::find($id);
                if ($emergency) {
                    $emergency->delete();
                    $deletedCount++;
                } else {
                    $failedIds[] = $id;
                }
            }

            // Clear cache for counts
            cache()->forget('emergency_counts');

            Log::info('Bulk delete completed', [
                'deleted_count' => $deletedCount,
                'failed_ids' => $failedIds
            ]);

            // IMPORTANT FIX: Check for Inertia request properly
            // Inertia requests have a special header 'X-Inertia' = true
            $isInertiaRequest = $request->header('X-Inertia') === 'true';

            if ($request->wantsJson() && !$isInertiaRequest) {
                // This is a pure API JSON request
                return response()->json([
                    'success' => true,
                    'message' => "Successfully deleted {$deletedCount} emergency records",
                    'deleted_count' => $deletedCount,
                    'failed_ids' => $failedIds
                ]);
            }

            // For Inertia requests, ALWAYS return a redirect (Inertia will handle it)
            return redirect()->back()->with('success', "Successfully deleted {$deletedCount} emergency records");

        } catch (\Exception $e) {
            Log::error('Failed to perform bulk delete: ' . $e->getMessage());

            $isInertiaRequest = $request->header('X-Inertia') === 'true';

            if ($request->wantsJson() && !$isInertiaRequest) {
                return response()->json(['success' => false, 'error' => 'Failed to delete emergencies: ' . $e->getMessage()], 500);
            }

            return redirect()->back()->with('error', 'Failed to delete emergencies: ' . $e->getMessage());
        }
    }

    /**
     * Revert an emergency status
     * Returns JSON for API calls, or redirect for Inertia
     */
    public function revert(Request $request, $id)
    {
        Log::info('Revert method called for ID: ' . $id);

        try {
            $emergency = Emergencies::find($id);
            if (!$emergency) {
                if ($request->wantsJson() || $request->is('api/*')) {
                    return response()->json(['error' => 'Emergency not found', 'success' => false], 404);
                }
                return redirect()->back()->with('error', 'Emergency not found');
            }

            $newStatus = $request->input('status');
            if (!in_array($newStatus, ['active', 'responding', 'resolved'])) {
                if ($request->wantsJson() || $request->is('api/*')) {
                    return response()->json(['error' => 'Invalid status', 'success' => false], 400);
                }
                return redirect()->back()->with('error', 'Invalid status');
            }

            $oldStatus = $emergency->status;
            $studentId = (string)$emergency->studentId;
            $student = Student::find($studentId);

            if (!$student) {
                $student = new \stdClass();
                $student->name = 'Unknown Student';
                $student->matrixNumber = 'N/A';
                $student->phone = 'N/A';
            }

            $emergency->status = $newStatus;
            if ($newStatus !== 'resolved') {
                $emergency->resolvedAt = null;
            }
            $emergency->save();

            // Clear cache for counts
            cache()->forget('emergency_counts');

            // Send mobile notification
            try {
                $nodeServerUrl = env('NODE_SERVER_URL', 'http://localhost:3000');
                Http::timeout(5)->post($nodeServerUrl . '/api/notify-emergency-status', [
                    'emergencyId' => (string)$emergency->_id,
                    'studentId' => $studentId,
                    'oldStatus' => $oldStatus,
                    'newStatus' => $newStatus,
                    'title' => $newStatus === 'responding' ? '🔄 Officer Responding' : '🔄 Emergency Active',
                    'message' => $newStatus === 'responding' ? 'An officer is responding to your location' : 'Your emergency is active and awaiting response'
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to notify mobile server for emergency revert: ' . $e->getMessage());
            }

            // ✅ SEND TELEGRAM NOTIFICATION TO THE ASSIGNED OFFICER FOR REVERT
            try {
                $assignedOfficer = null;
                if ($emergency->assigned_officer_id) {
                    $assignedOfficer = Officer::where('officerId', $emergency->assigned_officer_id)->first();
                }
                if (!$assignedOfficer && $emergency->assigned_officer_name) {
                    $assignedOfficer = Officer::where('officerName', $emergency->assigned_officer_name)->first();
                }

                if ($assignedOfficer && $assignedOfficer->telegram_chat_id && $assignedOfficer->receive_emergency) {
                    Log::info('Sending Telegram revert notification to assigned officer only: ' . $assignedOfficer->officerName);

                    if ($newStatus === 'responding') {
                        // COMPLETE message for responding status
                        $message = "👮 *OFFICER DISPATCHED* 👮\n\n";
                        $message .= "*{$assignedOfficer->officerName}*, you have been assigned to an emergency.\n\n";
                        $message .= "*Student:* " . ($student->name ?? 'Unknown') . "\n";
                        $message .= "*Matrix:* " . ($student->matrixNumber ?? 'N/A') . "\n";
                        $message .= "*Phone:* " . ($student->phone ?? 'N/A') . "\n";
                        $message .= "*Location:* " . ($emergency->address ?? 'Unknown') . "\n";
                        $message .= "*Reported at:* " . ($emergency->triggeredAt instanceof \DateTime
                            ? $emergency->triggeredAt->format('d/m/Y H:i:s')
                            : date('d/m/Y H:i:s', strtotime($emergency->triggeredAt))) . "\n\n";
                        $message .= "📋 *Your Task:*\n";
                        $message .= "• Respond to the location immediately\n";
                        $message .= "• Assess the situation\n";
                        $message .= "• Provide assistance to the student\n";
                        $message .= "• Update the status when resolved\n\n";
                        $message .= "⚠️ *Please respond to this emergency as soon as possible!*\n\n";
                        $message .= "Use `/myemergencies` to view your active emergencies.\n";
                        $message .= "Use `/resolve` to mark as resolved when done.";
                    } else {
                        // Message for active status
                        $message = "🚨 *EMERGENCY ACTIVE* 🚨\n\n";
                        $message .= "*Student:* " . ($student->name ?? 'Unknown') . "\n";
                        $message .= "*Matrix:* " . ($student->matrixNumber ?? 'N/A') . "\n";
                        $message .= "*Phone:* " . ($student->phone ?? 'N/A') . "\n";
                        $message .= "*Location:* " . ($emergency->address ?? 'Unknown') . "\n";
                        $message .= "*Reported at:* " . ($emergency->triggeredAt instanceof \DateTime
                            ? $emergency->triggeredAt->format('d/m/Y H:i:s')
                            : date('d/m/Y H:i:s', strtotime($emergency->triggeredAt))) . "\n\n";
                        $message .= "⚠️ You are assigned to this emergency. Please respond as soon as possible.\n\n";
                        $message .= "Use `/myemergencies` to view your active emergencies.\n";
                        $message .= "Use `/resolve` to mark as resolved when done.";
                    }

                    $this->sendTelegramMessage($assignedOfficer->telegram_chat_id, $message);
                    Log::info('Telegram revert notification sent to assigned officer: ' . $assignedOfficer->officerName);
                } else {
                    Log::info('No assigned officer found with Telegram for revert notification', [
                        'officer_id' => $emergency->assigned_officer_id,
                        'officer_name' => $emergency->assigned_officer_name,
                        'has_chat_id' => isset($assignedOfficer->telegram_chat_id),
                        'receive_emergency' => $assignedOfficer->receive_emergency ?? false
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to send Telegram revert notification to assigned officer: ' . $e->getMessage());
            }

            // Check if this is an Inertia request or API request
            $isInertiaRequest = $request->header('X-Inertia') === 'true';
            if ($request->wantsJson() && !$isInertiaRequest) {
                return response()->json(['success' => true, 'emergency' => $emergency]);
            }

            // For Inertia requests, redirect back with success message
            return redirect()->back()->with('success', 'Emergency status reverted successfully');

        } catch (\Exception $e) {
            Log::error('Failed to revert emergency status: ' . $e->getMessage());

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json(['success' => false, 'error' => 'Failed to revert emergency status: ' . $e->getMessage()], 500);
            }

            return redirect()->back()->with('error', 'Failed to revert emergency status: ' . $e->getMessage());
        }
    }

    /**
     * Update live location of an emergency
     */
    public function updateLiveLocation(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'latitude' => 'required|numeric',
                'longitude' => 'required|numeric',
                'address' => 'nullable|string'
            ]);

            $emergency = Emergencies::find($id);
            if (!$emergency) {
                return response()->json(['success' => false, 'error' => 'Emergency not found'], 404);
            }

            $emergency->latitude = $validated['latitude'];
            $emergency->longitude = $validated['longitude'];
            $emergency->address = $validated['address'] ?? $emergency->address;

            // Update location field for GeoJSON queries
            $emergency->location = [
                'type' => 'Point',
                'coordinates' => [(float)$validated['longitude'], (float)$validated['latitude']]
            ];

            $emergency->save();

            return response()->json(['success' => true, 'emergency' => $emergency]);
        } catch (\Exception $e) {
            Log::error('Failed to update live location: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get live location of an emergency
     */
    public function getLiveLocation($id)
    {
        try {
            $emergency = Emergencies::find($id);
            if (!$emergency) {
                return response()->json(['success' => false, 'error' => 'Emergency not found'], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'latitude' => $emergency->latitude,
                    'longitude' => $emergency->longitude,
                    'address' => $emergency->address,
                    'updated_at' => $emergency->updated_at
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get live location: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Start live tracking for an emergency
     */
    public function startLiveTracking(Request $request, $id)
    {
        try {
            $emergency = Emergencies::find($id);
            if (!$emergency) {
                return response()->json(['success' => false, 'error' => 'Emergency not found'], 404);
            }

            $emergency->live_tracking = true;
            $emergency->live_tracking_started_at = now();
            $emergency->save();

            return response()->json(['success' => true, 'message' => 'Live tracking started']);
        } catch (\Exception $e) {
            Log::error('Failed to start live tracking: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
