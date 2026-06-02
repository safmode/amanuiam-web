<?php
// routes/api.php

use App\Http\Controllers\EmergencyController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\OfficerController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\PasswordChangeController;
use App\Http\Controllers\DigestController;
use App\Http\Controllers\SafetyTipsController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\Student;

// ============================================
// PUBLIC API ROUTES (No auth required)
// ============================================

Route::post('/ai/analyze-report', [ReportController::class, 'analyzeWithAI']);

Route::get('/students/search', function (Request $request) {
    $student = Student::where('matrixNumber', $request->matric)->first();
    if ($student) {
        return response()->json([
            'student' => [
                '_id' => (string)$student->_id,
                'name' => $student->name,
                'email' => $student->email,
                'phone' => $student->phone,
                'matrixNumber' => $student->matrixNumber,
            ]
        ]);
    }
    return response()->json(['student' => null]);
});

// ============================================
// PROTECTED API ROUTES (Auth required)
// ============================================

Route::middleware('auth')->group(function () {

    // Dashboard
    Route::get('/dashboard/recent-data', [DashboardController::class, 'getRecentReports']);

    // Emergency endpoints
    Route::get('/emergencies', [EmergencyController::class, 'index']);
    Route::get('/emergencies/counts', [EmergencyController::class, 'getActiveCount']);
    Route::get('/emergencies/{id}', [EmergencyController::class, 'show']);
    Route::put('/emergencies/{id}/dispatch', [EmergencyController::class, 'dispatch']);
    Route::put('/emergencies/{id}/resolve', [EmergencyController::class, 'resolve']);
    Route::put('/emergencies/{id}/revert', [EmergencyController::class, 'revert']);
    Route::delete('/emergencies/{id}', [EmergencyController::class, 'destroy']);
    Route::post('/emergencies/bulk-delete', [EmergencyController::class, 'bulkDelete']);
    Route::put('/emergencies/{id}/live-location', [EmergencyController::class, 'updateLiveLocation']);
    Route::get('/emergencies/{id}/live-location', [EmergencyController::class, 'getLiveLocation']);
    Route::post('/emergencies/{id}/start-tracking', [EmergencyController::class, 'startLiveTracking']);

    // Notification endpoints
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Report endpoints
    Route::get('/reports/recent', [ReportController::class, 'getRecent']);
    Route::post('/reports/upload-attachments', [ReportController::class, 'uploadAttachments']);
    Route::post('/reports/upload-for-new', [ReportController::class, 'uploadForNewReport']);
    Route::delete('/reports/delete-attachment', [ReportController::class, 'deleteAttachment']);
    Route::get('/reports/{reportId}/attachments', [ReportController::class, 'getAttachments']);

    // Officer endpoints
    Route::get('/officers/list', [OfficerController::class, 'getOfficersList']);
    Route::get('/pending-admins', function () {
        return App\Models\Admins::where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();
    });

    // Settings endpoints
    Route::post('/settings/notification-preferences', [SettingsController::class, 'updateNotificationPreferences']);
    Route::get('/settings/notification-preferences', [SettingsController::class, 'getNotificationPreferences']);
    Route::post('/settings/dark-mode', [SettingsController::class, 'updateDarkMode']);
    Route::get('/settings/dark-mode', [SettingsController::class, 'getDarkMode']);

    // Password change endpoints
    Route::post('/password/send-code', [PasswordChangeController::class, 'sendCode']);
    Route::post('/password/verify-change', [PasswordChangeController::class, 'verifyAndChange']);
    Route::post('/password/resend-code', [PasswordChangeController::class, 'resendCode']);

    // Digest endpoints
    Route::post('/digest/send', [DigestController::class, 'send']);

    // Safety tips endpoints
    Route::prefix('/safety-tips')->group(function () {
        Route::post('/send', [SafetyTipsController::class, 'send']);
        Route::get('/history', [SafetyTipsController::class, 'history']);
        Route::get('/{id}', [SafetyTipsController::class, 'show']);
    });
});
