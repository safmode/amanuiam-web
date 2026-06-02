<?php
// routes/web.php

use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\OfficerController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\EmergencyController;
use App\Http\Controllers\PasswordChangeController;
use App\Http\Controllers\DigestController;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Http;
use App\Models\Emergencies;
use App\Models\Student;

// ============================================
// TEST ROUTES
// ============================================

Route::get('/test-db', function() {
    try {
        DB::connection('mongodb')->command(['ping' => 1]);
        return 'MongoDB connection: SUCCESS ✅';
    } catch (\Exception $e) {
        return 'MongoDB error: ' . $e->getMessage();
    }
});

Route::get('/test-session', function() {
    session(['test' => 'working']);
    return 'Session test: ' . session('test');
});

// ============================================
// SELF-PING (Keep for uptime monitoring)
// ============================================

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'app' => 'Emergency Alert System'
    ]);
})->name('health.check');

// ============================================
// WEBHOOK ROUTES (External - No CSRF)
// ============================================

Route::post('/webhook/new-report', function (Request $request) {
    Log::info('📢 New report webhook received:', $request->all());

    try {
        $reportId = $request->input('reportId');
        $category = $request->input('category');
        $mahallah = $request->input('mahallah');
        $description = $request->input('description');

        if (!$reportId) {
            return response()->json(['success' => false, 'error' => 'Missing reportId'], 400);
        }

        Log::info("✅ New report #{$reportId} from {$mahallah}: {$category}");

        $tempReport = new \stdClass();
        $tempReport->reportId = $reportId;
        $tempReport->incidentCategory = $category;
        $tempReport->mahallah = $mahallah;
        $tempReport->description = $description;

        $notification = App\Http\Controllers\NotificationController::createNewReport($tempReport);

        return response()->json(['success' => true]);
    } catch (\Exception $e) {
        Log::error('❌ Failed to process report webhook: ' . $e->getMessage());
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});

Route::post('/webhook/emergency-alert', function (Request $request) {
    Log::info('🚨 Emergency alert webhook received:', $request->all());

    try {
        $studentId = $request->input('studentId');
        $latitude = $request->input('latitude');
        $longitude = $request->input('longitude');
        $address = $request->input('address');
        $emergencyId = $request->input('emergencyId');

        if (!$studentId || !$latitude || !$longitude) {
            return response()->json([
                'success' => false,
                'error' => 'Missing required fields'
            ], 400);
        }

        $student = Student::find($studentId);

        if (!$student) {
            return response()->json(['success' => false, 'error' => 'Student not found'], 400);
        }

        $emergencyIdentifier = $emergencyId ?? 'EMG-' . uniqid();

        $emergency = Emergencies::create([
            '_id' => $emergencyIdentifier,
            'student_id' => $studentId,
            'student_name' => $student->name,
            'student_matrix' => $student->matrixNumber,
            'student_phone' => $student->phone,
            'location' => [
                'type' => 'Point',
                'coordinates' => [(float)$longitude, (float)$latitude]
            ],
            'address' => $address,
            'status' => 'active',
            'triggeredAt' => now(),
        ]);

        App\Http\Controllers\NotificationController::createEmergencyAlert($emergency, $student);

        return response()->json(['success' => true, 'emergency_id' => $emergencyIdentifier]);
    } catch (\Exception $e) {
        Log::error('❌ Failed to process emergency webhook: ' . $e->getMessage());
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});

// ============================================
// TELEGRAM WEBHOOK ROUTES
// ============================================

if (!function_exists('sendTelegramMessage')) {
    function sendTelegramMessage($chatId, $message, $parseMode = 'Markdown')
    {
        $token = env('TELEGRAM_BOT_TOKEN');
        try {
            $response = Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => $parseMode
            ]);
            return $response;
        } catch (\Exception $e) {
            Log::error('Failed to send Telegram message: ' . $e->getMessage());
            return null;
        }
    }
}

Route::get('/telegram/bot-status', function () {
    $token = env('TELEGRAM_BOT_TOKEN');
    if (!$token) {
        return response()->json(['error' => 'TELEGRAM_BOT_TOKEN not set'], 500);
    }
    $response = Http::get("https://api.telegram.org/bot{$token}/getMe");
    return response()->json($response->json());
});

Route::get('/telegram/webhook-info', function () {
    $token = env('TELEGRAM_BOT_TOKEN');
    $response = Http::get("https://api.telegram.org/bot{$token}/getWebhookInfo");
    return response()->json($response->json());
});

Route::get('/telegram/set-webhook', function () {
    $token = env('TELEGRAM_BOT_TOKEN');
    $webhookUrl = url('/telegram/webhook');
    $response = Http::post("https://api.telegram.org/bot{$token}/setWebhook", [
        'url' => $webhookUrl
    ]);
    return response()->json([
        'success' => $response->successful(),
        'webhook_url' => $webhookUrl
    ]);
});

Route::post('/telegram/webhook', function (Request $request) {
    Log::info('Telegram webhook received:', $request->all());
    return response()->json(['status' => 'ok']);
});

// ============================================
// AUTHENTICATION ROUTES (Public)
// ============================================

Route::get('/', [AdminAuthController::class, 'showLogin'])->name('login');
Route::get('/register', [AdminAuthController::class, 'showRegister'])->name('register');
Route::post('/login', [AdminAuthController::class, 'login']);
Route::post('/register', [AdminAuthController::class, 'register']);
Route::post('/logout', [AdminAuthController::class, 'logout'])->name('logout');

// ============================================
// PROTECTED ROUTES (Auth required) - EVERYTHING HERE
// ============================================

Route::middleware('auth')->group(function () {

    // ========== INERTIA PAGE RENDERS ==========
    Route::get('/Dashboard', fn() => Inertia::render('Dashboard'))->name('dashboard');
    Route::get('/Alerts', fn() => Inertia::render('Alerts'))->name('alerts');
    Route::get('/Settings', fn() => Inertia::render('Settings'))->name('settings');
    Route::get('/Reports', [ReportController::class, 'index'])->name('reports');
    Route::get('/Officers', [OfficerController::class, 'index'])->name('officers');
    Route::get('/Heatmap', [MapController::class, 'index'])->name('heatmap');
    Route::get('/Statistics', [StatisticsController::class, 'index'])->name('statistics');
    Route::get('/Approvals', function () {
        $allAdmins = App\Models\Admins::orderBy('created_at', 'desc')->get();
        return Inertia::render('Approvals', ['allAdmins' => $allAdmins]);
    })->name('approvals');

    // ========== EMERGENCY ENDPOINTS ==========
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

    // ========== NOTIFICATION ENDPOINTS ==========
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // ========== REPORT ENDPOINTS ==========
    Route::post('/Reports', [ReportController::class, 'store'])->name('reports.store');
    Route::put('/Reports/{reportId}', [ReportController::class, 'update'])->name('reports.update');
    Route::delete('/Reports/{reportId}', [ReportController::class, 'destroy'])->name('reports.destroy');
    Route::get('/Reports/recent', [ReportController::class, 'getRecent']);
    Route::get('/reports/{reportId}/attachments', [ReportController::class, 'getAttachments']);
    Route::post('/reports/upload-attachments', [ReportController::class, 'uploadAttachments']);
    Route::post('/reports/upload-for-new', [ReportController::class, 'uploadForNewReport']);
    Route::delete('/reports/delete-attachment', [ReportController::class, 'deleteAttachment']);

    // ========== OFFICER ENDPOINTS ==========
    Route::post('/Officers', [OfficerController::class, 'store'])->name('officers.store');
    Route::put('/Officers/{officerId}', [OfficerController::class, 'update'])->name('officers.update');
    Route::delete('/Officers/{officerId}', [OfficerController::class, 'destroy'])->name('officers.destroy');
    Route::get('/officers/list', [OfficerController::class, 'getOfficersList']);

    // ========== DASHBOARD ENDPOINTS ==========
    Route::get('/dashboard/recent-data', [DashboardController::class, 'getRecentReports']);
    Route::get('/heatmap-data', [MapController::class, 'getHeatmapData']);
    Route::get('/pending-admins', function () {
        return App\Models\Admins::where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();
    });

    // ========== ADMIN MANAGEMENT ==========
    Route::put('/admin/update-status/{adminId}', [AdminAuthController::class, 'updateStatus']);
    Route::put('/admin/approve/{adminId}', [AdminAuthController::class, 'approve']);
    Route::put('/admin/reject/{adminId}', [AdminAuthController::class, 'reject']);

    // ========== SETTINGS ENDPOINTS (ALL HERE - NO /api) ==========
    Route::put('/settings/profile', [SettingsController::class, 'updateProfile']);
    Route::put('/settings/password', [SettingsController::class, 'changePassword']);
    Route::post('/settings/two-factor', [SettingsController::class, 'toggleTwoFactor']);
    Route::post('/logout-all', [SettingsController::class, 'logoutAllDevices']);
    Route::post('/settings/dark-mode', [SettingsController::class, 'updateDarkMode']);
    Route::get('/settings/dark-mode', [SettingsController::class, 'getDarkMode']);
    Route::post('/settings/notification-preferences', [SettingsController::class, 'updateNotificationPreferences']);
    Route::get('/settings/notification-preferences', [SettingsController::class, 'getNotificationPreferences']);

    // ========== PASSWORD CHANGE ==========
    Route::post('/password/send-code', [PasswordChangeController::class, 'sendCode']);
    Route::post('/password/verify-change', [PasswordChangeController::class, 'verifyAndChange']);
    Route::post('/password/resend-code', [PasswordChangeController::class, 'resendCode']);

    // ========== DIGEST ==========
    Route::post('/digest/send', [DigestController::class, 'send']);

    // ========== SAFETY TIPS ==========
    Route::prefix('/safety-tips')->group(function () {
        Route::post('/send', [App\Http\Controllers\SafetyTipsController::class, 'send']);
        Route::get('/history', [App\Http\Controllers\SafetyTipsController::class, 'history']);
        Route::get('/{id}', [App\Http\Controllers\SafetyTipsController::class, 'show']);
    });
});

// ============================================
// FALLBACK ROUTE
// ============================================

Route::fallback(function () {
    return Inertia::render('NotFound');
});
