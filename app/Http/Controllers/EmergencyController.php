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
     * Get all emergencies with pagination - WITH LOCATION FILTERING (same as Reports)
     */
    public function index(Request $request)
    {
        try {
            $perPage = (int) $request->get('per_page', 15);
            $page = (int) $request->get('page', 1);
            $status = $request->get('status');
            $locations = $request->get('locations');

            Log::info('Emergency index called', [
                'status' => $status,
                'locations' => $locations,
                'page' => $page,
                'per_page' => $perPage
            ]);

            // Build query
            $query = Emergencies::orderBy('triggeredAt', 'desc');

            // Apply status filter
            if ($status) {
                $statuses = explode(',', $status);
                $query->whereIn('status', $statuses);
            }

            // Apply location filter using the same logic as Reports
            if ($locations) {
                $locationArray = explode(',', $locations);

                // First, get all emergencies
                $allEmergencies = $query->get();

                // Filter emergencies by determining their actual location using proximity
                $filteredIds = [];
                foreach ($allEmergencies as $emergency) {
                    // Create a fake report object to use the trait's method
                    $fakeReport = new \stdClass();
                    $fakeReport->location = [
                        'latitude' => $emergency->latitude,
                        'longitude' => $emergency->longitude,
                        'address' => $emergency->address,
                        'locationArea' => $emergency->address
                    ];
                    $fakeReport->description = '';
                    $fakeReport->address = $emergency->address;

                    $determinedLocationKey = $this->determineReportLocation($fakeReport, true);

                    if ($determinedLocationKey && in_array($determinedLocationKey, $locationArray)) {
                        $filteredIds[] = $emergency->_id;
                        Log::debug("Emergency {$emergency->_id} matched location: {$determinedLocationKey}");
                    }
                }

                // Apply the filter to the query
                if (!empty($filteredIds)) {
                    $query->whereIn('_id', array_unique($filteredIds));
                } else {
                    $query->whereIn('_id', []);
                }
            }

            // Select only needed fields
            $query->select([
                '_id', 'studentId', 'status', 'triggeredAt', 'address', 'location',
                'assigned_officer_id', 'assigned_officer_name', 'dispatch_notes',
                'dispatched_at', 'resolvedAt', 'latitude', 'longitude'
            ]);

            // Execute paginated query
            $emergencies = $query->paginate($perPage, ['*'], 'page', $page);

            Log::info('Emergency query executed', [
                'total' => $emergencies->total(),
                'count' => $emergencies->count()
            ]);

            // Batch load all students
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

            // Transform results
            $emergencies->getCollection()->transform(function ($emergency) use ($students) {
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

                $emergency->assigned_officer_id = $emergency->assigned_officer_id ?? null;
                $emergency->assigned_officer_name = $emergency->assigned_officer_name ?? null;
                $emergency->dispatch_notes = $emergency->dispatch_notes ?? null;
                $emergency->dispatched_at = $emergency->dispatched_at ?? null;

                return $emergency;
            });

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
     * Get emergency counts
     */
    public function getActiveCount()
    {
        try {
            $counts = cache()->remember('emergency_counts', 30, function () {
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

            return response()->json(['success' => true, 'data' => $emergency]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch emergency: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to fetch emergency'], 500);
        }
    }

    /**
     * Dispatch an officer to an emergency
     */
    public function dispatch(Request $request, $id)
    {
        Log::info('Dispatch method called for ID: ' . $id);

        try {
            $validated = $request->validate([
                'officerId' => 'required|string',
                'officerName' => 'required|string',
                'dispatchNotes' => 'nullable|string'
            ]);

            $emergency = Emergencies::find($id);
            if (!$emergency) {
                return response()->json(['error' => 'Emergency not found', 'success' => false], 404);
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

            $emergency->status = 'responding';
            $emergency->assigned_officer_id = $validated['officerId'];
            $emergency->assigned_officer_name = $validated['officerName'];
            $emergency->dispatch_notes = $validated['dispatchNotes'] ?? null;
            $emergency->dispatched_at = now();
            $emergency->save();

            cache()->forget('emergency_counts');

            // Send Telegram notification to assigned officer
            try {
                $assignedOfficer = Officer::where('officerName', $validated['officerName'])
                    ->orWhere('officerId', $validated['officerId'])
                    ->first();

                if ($assignedOfficer && $assignedOfficer->telegram_chat_id && $assignedOfficer->receive_emergency) {
                    $message = "👮 *TASK ASSIGNED TO YOU* 👮\n\n";
                    $message .= "*{$assignedOfficer->officerName}*, you have been assigned to an emergency.\n\n";
                    $message .= "*Student:* " . ($student->name ?? 'Unknown') . "\n";
                    $message .= "*Matrix:* " . ($student->matrixNumber ?? 'N/A') . "\n";
                    $message .= "*Phone:* " . ($student->phone ?? 'N/A') . "\n";
                    $message .= "*Location:* " . ($emergency->address ?? 'Unknown') . "\n";
                    $message .= "*Reported at:* " . $emergency->triggeredAt->format('d/m/Y H:i:s') . "\n\n";
                    $message .= "📋 *Your Task:*\n";
                    $message .= "• Respond to the location immediately\n";
                    $message .= "• Assess the situation\n";
                    $message .= "• Provide assistance to the student\n";
                    $message .= "• Update the status when resolved\n\n";
                    $message .= "⚠️ *Please respond to this emergency as soon as possible!*";

                    $this->sendTelegramMessage($assignedOfficer->telegram_chat_id, $message);
                }
            } catch (\Exception $e) {
                Log::error('Failed to send Telegram notification: ' . $e->getMessage());
            }

            // Send mobile notification
            try {
                $nodeServerUrl = env('NODE_SERVER_URL', 'http://localhost:3000');
                Http::timeout(5)->post($nodeServerUrl . '/api/notify-emergency-status', [
                    'emergencyId' => (string)$emergency->_id,
                    'studentId' => $studentId,
                    'oldStatus' => $oldStatus,
                    'newStatus' => 'responding',
                    'title' => '👮 Officer Dispatched',
                    'message' => "Officer {$validated['officerName']} has been dispatched to your location. Stay calm and await assistance."
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to notify mobile server: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'emergency' => $emergency]);
        } catch (\Exception $e) {
            Log::error('Failed to dispatch officer: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to dispatch officer: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Resolve an emergency
     */
    public function resolve($id)
    {
        try {
            $emergency = Emergencies::find($id);
            if (!$emergency) {
                return response()->json(['error' => 'Emergency not found', 'success' => false], 404);
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

            cache()->forget('emergency_counts');

            // Send Telegram notification to assigned officer
            try {
                $assignedOfficer = null;
                if ($emergency->assigned_officer_id) {
                    $assignedOfficer = Officer::where('officerId', $emergency->assigned_officer_id)->first();
                }
                if (!$assignedOfficer && $emergency->assigned_officer_name) {
                    $assignedOfficer = Officer::where('officerName', $emergency->assigned_officer_name)->first();
                }

                if ($assignedOfficer && $assignedOfficer->telegram_chat_id && $assignedOfficer->receive_emergency) {
                    $message = "✅ *EMERGENCY RESOLVED* ✅\n\n";
                    $message .= "*Student:* " . ($student->name ?? 'Unknown') . "\n";
                    $message .= "*Status:* Emergency has been marked as resolved\n";
                    $message .= "*Time:* " . now()->format('d/m/Y H:i:s') . "\n\n";
                    $message .= "The situation has been handled. Good work, {$assignedOfficer->officerName}!";

                    $this->sendTelegramMessage($assignedOfficer->telegram_chat_id, $message);
                }
            } catch (\Exception $e) {
                Log::error('Failed to send Telegram resolution notification: ' . $e->getMessage());
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
                Log::error('Failed to notify mobile server: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'emergency' => $emergency]);
        } catch (\Exception $e) {
            Log::error('Failed to resolve emergency: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to resolve emergency: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete an emergency record
     */
    public function destroy($id)
    {
        try {
            $emergency = Emergencies::find($id);

            if (!$emergency) {
                return response()->json(['success' => false, 'error' => 'Emergency not found'], 404);
            }

            $studentId = (string)$emergency->studentId;
            $emergencyId = (string)$emergency->_id;
            $emergency->delete();

            cache()->forget('emergency_counts');

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

            return response()->json(['success' => true, 'message' => 'Emergency record deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Failed to delete emergency: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to delete emergency: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Bulk delete emergencies
     */
    public function bulkDelete(Request $request)
    {
        try {
            $validated = $request->validate([
                'ids' => 'required|array',
                'ids.*' => 'required|string'
            ]);

            $deletedCount = 0;

            foreach ($validated['ids'] as $id) {
                $emergency = Emergencies::find($id);
                if ($emergency) {
                    $emergency->delete();
                    $deletedCount++;
                }
            }

            cache()->forget('emergency_counts');

            return response()->json([
                'success' => true,
                'message' => "Successfully deleted {$deletedCount} emergency records",
                'deleted_count' => $deletedCount
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to perform bulk delete: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to delete emergencies: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Revert an emergency status
     */
    public function revert(Request $request, $id)
    {
        try {
            $emergency = Emergencies::find($id);
            if (!$emergency) {
                return response()->json(['error' => 'Emergency not found', 'success' => false], 404);
            }

            $newStatus = $request->input('status');
            if (!in_array($newStatus, ['active', 'responding', 'resolved'])) {
                return response()->json(['error' => 'Invalid status', 'success' => false], 400);
            }

            $oldStatus = $emergency->status;
            $studentId = (string)$emergency->studentId;
            $student = Student::find($studentId);

            if (!$student) {
                $student = new \stdClass();
                $student->name = 'Unknown Student';
            }

            $emergency->status = $newStatus;
            if ($newStatus !== 'resolved') {
                $emergency->resolvedAt = null;
            }
            $emergency->save();

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
                Log::error('Failed to notify mobile server: ' . $e->getMessage());
            }

            // Send Telegram notification to assigned officer for revert
            try {
                $assignedOfficer = null;
                if ($emergency->assigned_officer_id) {
                    $assignedOfficer = Officer::where('officerId', $emergency->assigned_officer_id)->first();
                }
                if (!$assignedOfficer && $emergency->assigned_officer_name) {
                    $assignedOfficer = Officer::where('officerName', $emergency->assigned_officer_name)->first();
                }

                if ($assignedOfficer && $assignedOfficer->telegram_chat_id && $assignedOfficer->receive_emergency) {
                    if ($newStatus === 'responding') {
                        $message = "👮 *OFFICER DISPATCHED* 👮\n\n";
                        $message .= "*Student:* " . ($student->name ?? 'Unknown') . "\n";
                        $message .= "*Officer:* " . ($emergency->assigned_officer_name ?? 'An officer') . "\n";
                        $message .= "*Status:* Responding to emergency\n\n";
                        $message .= "✅ You have been assigned to respond to this emergency.";
                    } else {
                        $message = "🚨 *EMERGENCY ACTIVE* 🚨\n\n";
                        $message .= "*Student:* " . ($student->name ?? 'Unknown') . "\n";
                        $message .= "*Location:* " . ($emergency->address ?? 'Unknown') . "\n\n";
                        $message .= "⚠️ You are assigned to this emergency. Please respond as soon as possible.";
                    }

                    $this->sendTelegramMessage($assignedOfficer->telegram_chat_id, $message);
                }
            } catch (\Exception $e) {
                Log::error('Failed to send Telegram revert notification: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'emergency' => $emergency]);
        } catch (\Exception $e) {
            Log::error('Failed to revert emergency status: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to revert emergency status: ' . $e->getMessage()], 500);
        }
    }
}
