<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportController;

// ============================================
// WEBHOOK FOR NODE.JS
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

Route::post('/notifications/emergency', function (Request $request) {
    try {
        $notification = new \App\Models\Notification();
        $notification->type = 'emergency_alert';
        $notification->title = '⚠️ URGENT';
        $notification->message = "Emergency from " . ($request->studentName ?? 'Student') . " at " . ($request->address ?? 'Unknown location');
        $notification->report_id = $request->emergencyId;
        $notification->report_title = "Emergency Alert at " . ($request->address ?? 'Unknown');
        $notification->status = 'active';
        $notification->read_by = [];
        $notification->save();

        // Also broadcast via Laravel's WebSocket if configured
        broadcast(new \App\Events\NewNotification($notification))->toOthers();

        return response()->json(['success' => true, 'notification' => $notification]);
    } catch (\Exception $e) {
        Log::error('Failed to save emergency notification: ' . $e->getMessage());
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});

// Your existing API routes can go here if you had any
