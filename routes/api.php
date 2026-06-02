<?php

use Illuminate\Support\Facades\Route;
use App\Models\SystemNotification;
use App\Models\Admins;
use App\Events\NotificationSent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\NotificationController;

// ============================================
// API ROUTES (Prefix: /api)
// ============================================

Route::post('/webhook/new-report', function (Request $request) {
    \Log::info('===== WEBHOOK HIT =====', $request->all());

    try {
        $report = new \stdClass();
        $report->reportId = $request->reportId;
        $report->incidentCategory = $request->category ?? 'other';
        $report->mahallah = $request->mahallah ?? 'Unknown';
        $report->description = $request->description ?? 'No description';

        NotificationController::createNewReport($report);

        return response()->json(['success' => true]);
    } catch (\Exception $e) {
        \Log::error('Webhook error: ' . $e->getMessage());
        return response()->json(['success' => false], 500);
    }
});

Route::post('/ai/analyze-report', [ReportController::class, 'analyzeWithAI']);

// ✅ THIS IS THE KEY ENDPOINT FOR EMERGENCY NOTIFICATIONS
Route::post('/notifications/emergency', function (Request $request) {
    try {
        Log::info('📢 Creating emergency notification:', $request->all());

        $notification = SystemNotification::create([
            'type' => 'emergency_alert',
            'title' => '⚠️ URGENT',
            'message' => $request->message,
            'report_id' => $request->report_id,
            'report_title' => $request->report_title,
            'status' => $request->status ?? 'active',
            'read_by' => [],
            'created_at' => now(),
            'student_id' => $request->student_id,
            'student_name' => $request->student_name,
            'student_matrix' => $request->student_matrix,
            'student_phone' => $request->student_phone,
            'location' => $request->location,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude
        ]);

        // Broadcast to all admins via Pusher
        $admins = Admins::all();
        $broadcastCount = 0;

        foreach ($admins as $admin) {
            try {
                broadcast(new NotificationSent($notification, (string)$admin->_id));
                $broadcastCount++;
            } catch (\Exception $e) {
                Log::warning("Failed to broadcast to admin {$admin->_id}: " . $e->getMessage());
            }
        }

        Log::info("✅ Emergency notification broadcast via Pusher to {$broadcastCount} admins", [
            'notification_id' => $notification->_id
        ]);

        return response()->json([
            'success' => true,
            'notification' => $notification,
            'broadcast_count' => $broadcastCount
        ]);

    } catch (\Exception $e) {
        Log::error('Failed to create emergency notification: ' . $e->getMessage());
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});
