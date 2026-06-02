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

// Webhook for new report notifications
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

// Webhook for emergency alerts
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

// Helper function for Telegram - DECLARED ONLY ONCE
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

// Main Telegram webhook handler
Route::post('/telegram/webhook', function (Request $request) {
    Log::info('Telegram webhook received:', $request->all());
    // Your existing Telegram webhook code here
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
// INERTIA PROTECTED ROUTES (Auth required)
// ============================================

Route::middleware('auth')->group(function () {
    // Inertia page renders
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

    // Report CRUD (non-API)
    Route::post('/Reports', [ReportController::class, 'store'])->name('reports.store');
    Route::put('/Reports/{reportId}', [ReportController::class, 'update'])->name('reports.update');
    Route::delete('/Reports/{reportId}', [ReportController::class, 'destroy'])->name('reports.destroy');

    // Officer CRUD
    Route::post('/Officers', [OfficerController::class, 'store'])->name('officers.store');
    Route::put('/Officers/{officerId}', [OfficerController::class, 'update'])->name('officers.update');
    Route::delete('/Officers/{officerId}', [OfficerController::class, 'destroy'])->name('officers.destroy');

    // Admin management
    Route::put('/admin/update-status/{adminId}', [AdminAuthController::class, 'updateStatus']);
    Route::put('/admin/approve/{adminId}', [AdminAuthController::class, 'approve']);
    Route::put('/admin/reject/{adminId}', [AdminAuthController::class, 'reject']);

    // Settings (non-API)
    Route::put('/settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.profile');
    Route::put('/settings/password', [SettingsController::class, 'changePassword'])->name('settings.password');
    Route::post('/settings/two-factor', [SettingsController::class, 'toggleTwoFactor'])->name('settings.two-factor');
    Route::post('/logout-all', [SettingsController::class, 'logoutAllDevices'])->name('logout-all');
});

// ============================================
// FALLBACK ROUTE
// ============================================

Route::fallback(function () {
    return Inertia::render('NotFound');
});
