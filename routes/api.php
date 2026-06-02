<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportController;

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
    \Log::info('📢 Emergency notification received:', $request->all());

    try {
        $notification = new \App\Models\Notification();
        $notification->type = $request->type;
        $notification->title = $request->title;
        $notification->message = $request->message;
        $notification->report_id = $request->report_id;
        $notification->report_title = $request->report_title;
        $notification->status = $request->status;
        $notification->student_id = $request->student_id;
        $notification->student_name = $request->student_name;
        $notification->student_matrix = $request->student_matrix;
        $notification->student_phone = $request->student_phone;
        $notification->location = $request->location;
        $notification->latitude = $request->latitude;
        $notification->longitude = $request->longitude;
        $notification->read_by = [];
        $notification->created_at = now();
        $notification->updated_at = now();
        $notification->save();

        \Log::info('✅ Emergency notification saved with ID: ' . $notification->_id);

        return response()->json(['success' => true, 'notification' => $notification]);
    } catch (\Exception $e) {
        \Log::error('Failed to save notification: ' . $e->getMessage());
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});
