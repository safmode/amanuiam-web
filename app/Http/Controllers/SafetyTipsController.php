<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\SystemNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SafetyTipsController extends Controller
{
    /**
     * Send safety tip/announcement to all students
     */
    public function send(Request $request)
    {
        try {
            $admin = Auth::user();

            $validated = $request->validate([
                'title' => 'required|string|max:100',
                'message' => 'required|string|max:500',
                'type' => 'required|in:safety_tip,reminder,weather,announcement',
                'priority' => 'required|in:low,normal,high'
            ]);

            // Get all students
            $students = Student::all();
            $nodeServerUrl = env('NODE_SERVER_URL', 'http://localhost:3000');

            $sentCount = 0;
            $failedCount = 0;

            // Format message for mobile
            $typeEmojis = [
                'safety_tip' => '🛡️',
                'reminder' => '🔔',
                'weather' => '🌧️',
                'announcement' => '📢'
            ];

            $typeLabels = [
                'safety_tip' => 'SAFETY TIP',
                'reminder' => 'REMINDER',
                'weather' => 'WEATHER ALERT',
                'announcement' => 'ANNOUNCEMENT'
            ];

            $priorityText = $validated['priority'] === 'high' ? 'HIGH PRIORITY - ' : '';

            $formattedMessage = "{$typeEmojis[$validated['type']]} *{$priorityText}{$typeLabels[$validated['type']]}*\n\n";
            $formattedMessage .= "**" . $validated['title'] . "**\n\n";
            $formattedMessage .= $validated['message'] . "\n\n";
            $formattedMessage .= "📅 " . now()->format('d/m/Y H:i') . "\n";
            $formattedMessage .= "👮 Sent by: " . $admin->name;

            // Send to each student's device via Node.js
            foreach ($students as $student) {
                try {
                    $response = Http::timeout(5)->post($nodeServerUrl . '/api/send-safety-tip', [
                        'studentId' => (string)$student->_id,
                        'title' => $validated['title'],
                        'message' => $formattedMessage,
                        'type' => $validated['type'],
                        'priority' => $validated['priority'],
                        'sent_at' => now()->toIso8601String(),
                        'sender' => $admin->name
                    ]);

                    if ($response->successful()) {
                        $sentCount++;
                    } else {
                        $failedCount++;
                        Log::warning('Failed to send to student: ' . $student->_id, ['response' => $response->body()]);
                    }
                } catch (\Exception $e) {
                    $failedCount++;
                    Log::error('Error sending to student: ' . $student->_id . ' - ' . $e->getMessage());
                }
            }

            // Store in database for history
            $notification = SystemNotification::create([
                'type' => 'safety_' . $validated['type'],
                'title' => $validated['title'],
                'message' => $validated['message'],
                'broadcast_type' => $validated['type'],
                'priority' => $validated['priority'],
                'sent_by' => $admin->name,
                'sent_by_id' => (string)$admin->_id,
                'students_reached' => $sentCount,
                'students_failed' => $failedCount,
                'created_at' => now()
            ]);

            Log::info('Safety tip broadcast completed', [
                'title' => $validated['title'],
                'sent' => $sentCount,
                'failed' => $failedCount,
                'sent_by' => $admin->name
            ]);

            // RETURN REDIRECT FOR INERTIA (NOT JSON)
            return redirect()->back()->with('success', "Announcement sent to {$sentCount} students");

        } catch (\Exception $e) {
            Log::error('Failed to send safety tip: ' . $e->getMessage());

            // RETURN REDIRECT WITH ERROR FOR INERTIA
            return redirect()->back()->with('error', 'Failed to send announcement: ' . $e->getMessage());
        }
    }

    /**
     * Get sent tips history - Returns JSON (this is fine since it's a GET request)
     */
    public function history(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 20);

            $tips = SystemNotification::where('type', 'like', 'safety_%')
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            // For GET requests, JSON is fine
            return response()->json([
                'success' => true,
                'data' => $tips->items(),
                'pagination' => [
                    'current_page' => $tips->currentPage(),
                    'per_page' => $tips->perPage(),
                    'total' => $tips->total(),
                    'last_page' => $tips->lastPage(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch safety tips history: ' . $e->getMessage());
            return response()->json(['success' => false, 'data' => []], 500);
        }
    }

    /**
     * Get single tip by ID
     */
    public function show($id)
    {
        try {
            $tip = SystemNotification::where('type', 'like', 'safety_%')
                ->where('_id', $id)
                ->first();

            if (!$tip) {
                return response()->json(['success' => false, 'error' => 'Not found'], 404);
            }

            return response()->json(['success' => true, 'data' => $tip]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
