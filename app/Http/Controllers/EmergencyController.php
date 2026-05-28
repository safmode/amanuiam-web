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

            Log::info('Emergency created - waiting for dispatch before sending Telegram');

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
     * Get all emergencies with pagination - OPTIMIZED VERSION
     */
    public function index(Request $request)
    {
        try {
            $perPage = (int) $request->get('per_page', 15);
            $page = (int) $request->get('page', 1);
            $status = $request->get('status');
            $locations = $request->get('locations');  // ADD THIS LINE

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

                // ADD THIS LINE - Determine location using the trait
                $emergency->determined_location = $this->determineEmergencyLocation($emergency);

                // Remove large fields that aren't needed for list view
                unset($emergency->location);

                return $emergency;
            });

            // ADD THIS BLOCK - Apply location filter if provided
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
     * Get emergency counts - CACHED VERSION (optional)
     * Add caching to reduce database queries
     */
    public function getActiveCount()
    {
        try {
            // Use cache to reduce database hits (cache for 30 seconds)
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
        Log::info('Dispatch data:', $request->all());

        try {
            $validated = $request->validate([
                'officerId' => 'required|string',
                'officerName' => 'required|string',
                'dispatchNotes' => 'nullable|string'
            ]);

            $emergency = Emergencies::find($id);
            if (!$emergency) {
                Log::error('Emergency not found: ' . $id);
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

            // Clear cache for counts
            cache()->forget('emergency_counts');

            Log::info('Emergency saved with assigned officer: ' . $emergency->assigned_officer_name);

            // Send Telegram notification ONLY to the ASSIGNED officer
            try {
                $assignedOfficer = Officer::where('officerName', $validated['officerName'])
                    ->orWhere('officerId', $validated['officerId'])
                    ->first();

                if ($assignedOfficer && $assignedOfficer->telegram_chat_id && $assignedOfficer->receive_emergency) {
                    Log::info('Sending Telegram notification to assigned officer only: ' . $assignedOfficer->officerName);

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
                } else {
                    Log::warning('Assigned officer not found or has no Telegram: ' . $validated['officerName']);
                }
            } catch (\Exception $e) {
                Log::error('Failed to send Telegram notification to assigned officer: ' . $e->getMessage());
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
                Log::error('Failed to notify mobile server for emergency dispatch: ' . $e->getMessage());
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
        Log::info('Resolve method called for ID: ' . $id);

        try {
            $emergency = Emergencies::find($id);
            if (!$emergency) {
                Log::error('Emergency not found: ' . $id);
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
        Log::info('Delete method called for ID: ' . $id);

        try {
            $emergency = Emergencies::find($id);

            if (!$emergency) {
                Log::error('Emergency not found for deletion: ' . $id);
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

            return response()->json([
                'success' => true,
                'message' => "Successfully deleted {$deletedCount} emergency records",
                'deleted_count' => $deletedCount,
                'failed_ids' => $failedIds
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
        Log::info('Revert method called for ID: ' . $id);

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

            // Send Telegram notification ONLY to the assigned officer for revert
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
                } else {
                    Log::info('No assigned officer found with Telegram for revert notification');
                }
            } catch (\Exception $e) {
                Log::error('Failed to send Telegram revert notification to assigned officer: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'emergency' => $emergency]);
        } catch (\Exception $e) {
            Log::error('Failed to revert emergency status: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to revert emergency status: ' . $e->getMessage()], 500);
        }
    }
}
