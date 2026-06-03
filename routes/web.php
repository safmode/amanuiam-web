<?php

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
// SELF-PING
// ============================================

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'app' => 'Emergency Alert System'
    ]);
})->name('health.check');


// ============================================
// WEBHOOK ROUTES
// ============================================

// Webhook for new report notifications
Route::get('/webhook/new-report', function (Request $request) {
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

        // Create a temporary report object that matches what NotificationController expects
        $tempReport = new \stdClass();
        $tempReport->reportId = $reportId;
        $tempReport->incidentCategory = $category;
        $tempReport->mahallah = $mahallah;
        $tempReport->description = $description;

        // Call NotificationController to create the notification (web dashboard only)
        $notification = App\Http\Controllers\NotificationController::createNewReport($tempReport);

        if ($notification) {
            Log::info("✅ Notification created via NotificationController for report: {$reportId}");
        } else {
            Log::warning("NotificationController returned null for report: {$reportId}");
        }

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

        // Check if emergency already exists
        $existingEmergency = Emergencies::where('_id', $emergencyId)->first();
        if ($existingEmergency) {
            Log::info("Emergency {$emergencyId} already exists, skipping creation");
            return response()->json(['success' => true, 'emergency_id' => $emergencyId]);
        }

        // ✅ Save ONLY studentId - NO duplicate student fields
        $emergencyData = [
            '_id' => $emergencyId,
            'studentId' => $studentId,
            'latitude' => (float)$latitude,
            'longitude' => (float)$longitude,
            'address' => $address,
            'status' => 'active',
            'triggeredAt' => now(),
        ];

        $emergency = Emergencies::create($emergencyData);

        // Get student name for notification only (not saved to emergency)
        $student = App\Models\Student::find($studentId);
        $studentName = $student ? $student->name : 'Unknown Student';

        // ✅ CREATE SYSTEM NOTIFICATION (student name used here, not saved to emergencies)
        $emergencyIdShort = substr((string)$emergency->_id, -6);

        Log::info("✅ Emergency saved to Laravel DB: {$emergencyId}");

        return response()->json([
            'success' => true,
            'emergency_id' => $emergencyId
        ]);

    } catch (\Exception $e) {
        Log::error('❌ Failed to process emergency webhook: ' . $e->getMessage());
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});

// ============================================
// TELEGRAM ROUTES
// ============================================

// Helper function to send Telegram messages
function sendTelegramMessage($chatId, $message, $parseMode = 'Markdown')
{
    $token = env('TELEGRAM_BOT_TOKEN');

    try {
        $response = Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => $parseMode
        ]);

        Log::info('Telegram message sent', [
            'chat_id' => $chatId,
            'success' => $response->successful()
        ]);

        return $response;
    } catch (\Exception $e) {
        Log::error('Failed to send Telegram message: ' . $e->getMessage());
        return null;
    }
}

// Debug endpoint to check bot status
Route::get('/telegram/bot-status', function () {
    $token = env('TELEGRAM_BOT_TOKEN');
    if (!$token) {
        return response()->json(['error' => 'TELEGRAM_BOT_TOKEN not set in .env'], 500);
    }

    $response = Http::get("https://api.telegram.org/bot{$token}/getMe");

    if ($response->successful()) {
        return response()->json([
            'success' => true,
            'bot' => $response->json()['result']
        ]);
    }

    return response()->json([
        'success' => false,
        'error' => $response->body()
    ], 500);
});

// Get webhook info
Route::get('/telegram/webhook-info', function () {
    $token = env('TELEGRAM_BOT_TOKEN');
    $response = Http::get("https://api.telegram.org/bot{$token}/getWebhookInfo");
    return response()->json($response->json());
});

// Set webhook (run once with ngrok URL)
Route::get('/telegram/set-webhook', function () {
    $token = env('TELEGRAM_BOT_TOKEN');
    $webhookUrl = url('/telegram/webhook');
    $response = Http::post("https://api.telegram.org/bot{$token}/setWebhook", [
        'url' => $webhookUrl
    ]);
    return response()->json([
        'success' => $response->successful(),
        'response' => $response->json(),
        'webhook_url' => $webhookUrl
    ]);
});

// Main webhook that handles all bot interactions
Route::post('/telegram/webhook', function (Request $request) {
    Log::info('Telegram webhook received:', $request->all());

    $update = $request->all();

    // Handle regular messages
    if (isset($update['message'])) {
        $message = $update['message'];
        $chatId = $message['chat']['id'];
        $firstName = $message['chat']['first_name'] ?? 'User';
        $text = strtolower(trim($message['text'] ?? ''));
        $originalText = $message['text'] ?? '';

        Log::info('Processing message', ['chat_id' => $chatId, 'text' => $text]);

        // Check if this chat is already linked to an officer
        $existingOfficer = App\Models\Officer::where('telegram_chat_id', (string)$chatId)->first();

        // Handle /start command
        if ($text === '/start') {
            if ($existingOfficer) {
                $welcomeMessage = "✅ *Welcome back, {$existingOfficer->officerName}!*\n\n";
                $welcomeMessage .= "You are already registered in the system.\n\n";
                $welcomeMessage .= "📋 *Emergency Commands:*\n";
                $welcomeMessage .= "`/myemergencies` - List your active emergencies\n";
                $welcomeMessage .= "`/resolve` - Resolve your current emergency\n\n";
                $welcomeMessage .= "📋 *Report Commands:*\n";
                $welcomeMessage .= "`/myreports` - List your assigned reports\n";
                $welcomeMessage .= "`/report REPORT_ID` - View report details\n";
                $welcomeMessage .= "`/update REPORT_ID status` - Update report status\n\n";
                $welcomeMessage .= "🆔 *General:*\n";
                $welcomeMessage .= "`/myid` - Show your Chat ID\n";
                $welcomeMessage .= "`/status` - Check registration status\n";
                $welcomeMessage .= "`/help` - Show all commands";
            } else {
                $welcomeMessage = "👋 *Hello {$firstName}!*\n\n";
                $welcomeMessage .= "Welcome to the IIUM Security Alert Bot.\n\n";
                $welcomeMessage .= "To receive emergency alerts, please provide your *Full Name* as registered in the system.\n\n";
                $welcomeMessage .= "Example: `Senior Security Officer` or `Ahmad Bin Abdullah`\n\n";
                $welcomeMessage .= "Type `/help` to see available commands.";
            }
            sendTelegramMessage($chatId, $welcomeMessage);
            return response()->json(['status' => 'ok']);
        }

        // Handle /myid command
        if ($text === '/myid') {
            $messageText = "🔑 *Your Telegram Chat ID:* `{$chatId}`\n\n";
            if ($existingOfficer) {
                $messageText .= "✅ You are already registered as: *{$existingOfficer->officerName}*";
            } else {
                $messageText .= "Please provide this ID to your administrator or type your name to register.";
            }
            sendTelegramMessage($chatId, $messageText);
            return response()->json(['status' => 'ok']);
        }

        // Handle /status command
        if ($text === '/status') {
            if ($existingOfficer) {
                $messageText = "✅ *Registration Status: Active*\n\n";
                $messageText .= "*Officer Name:* {$existingOfficer->officerName}\n";
                $messageText .= "*Rank:* {$existingOfficer->rank}\n";
                $messageText .= "*Department:* {$existingOfficer->department}\n";
                $messageText .= "*Emergency Alerts:* " . ($existingOfficer->receive_emergency ? 'Enabled ✅' : 'Disabled ❌') . "\n\n";
                $messageText .= "You will receive notifications ONLY when dispatched to an emergency.";
            } else {
                $messageText = "❌ *Registration Status: Not Registered*\n\n";
                $messageText .= "Please type your full name to register.\n";
                $messageText .= "Your Chat ID is: `{$chatId}`";
            }
            sendTelegramMessage($chatId, $messageText);
            return response()->json(['status' => 'ok']);
        }

        // Handle /myemergencies or /myalerts command
        if ($text === '/myemergencies' || $text === '/myalerts') {
            if (!$existingOfficer) {
                sendTelegramMessage($chatId, "❌ You are not registered. Please type your name to register first.");
                return response()->json(['status' => 'ok']);
            }

            $emergencies = App\Models\Emergencies::where('assigned_officer_id', $existingOfficer->officerId)
                ->whereIn('status', ['active', 'responding'])
                ->orderBy('triggeredAt', 'desc')
                ->get();

            if ($emergencies->isEmpty()) {
                sendTelegramMessage($chatId, "📭 You have no active emergencies assigned to you.");
                return response()->json(['status' => 'ok']);
            }

            $messageText = "📋 *Your Active Emergencies*\n\n";
            foreach ($emergencies as $emergency) {
                $statusIcon = $emergency->status === 'active' ? '🚨' : '👮';
                $messageText .= "{$statusIcon} *ID:* `{$emergency->_id}`\n";
                $messageText .= "   *Location:* " . ($emergency->address ?? 'Unknown') . "\n";
                $messageText .= "   *Time:* " . $emergency->triggeredAt->format('d/m/Y H:i') . "\n";
                $messageText .= "   *Status:* " . ($emergency->status === 'active' ? 'Active' : 'Responding') . "\n\n";
            }
            $messageText .= "To resolve: `/resolve EMERGENCY_ID`\n";
            $messageText .= "Or just `/resolve` to resolve your most recent emergency.";

            sendTelegramMessage($chatId, $messageText);
            return response()->json(['status' => 'ok']);
        }

        // Handle /myreports command - Show ONLY assigned reports
        if ($text === '/myreports') {
            if (!$existingOfficer) {
                sendTelegramMessage($chatId, "❌ You are not registered. Please type your name to register first.");
                return response()->json(['status' => 'ok']);
            }

            // Find reports assigned to this officer only
            $reports = App\Models\Report::where('assignedOfficer', $existingOfficer->officerId)
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get();

            if ($reports->isEmpty()) {
                sendTelegramMessage($chatId, "📭 You have no reports assigned to you.");
                return response()->json(['status' => 'ok']);
            }

            $messageText = "📋 *Your Assigned Reports* 📋\n\n";
            foreach ($reports as $report) {
                $statusIcon = $report->status === 'resolved' ? '✅' : ($report->status === 'pending' ? '⏳' : '🔄');
                $urgencyIcon = $report->urgency === 'urgent' ? '🚨 ' : '';

                $categoryLabels = [
                    'theft' => 'Theft/Robbery',
                    'harassment' => 'Harassment',
                    'vandalism' => 'Vandalism',
                    'fireHazard' => 'Fire Hazard',
                    'suspiciousActivity' => 'Suspicious Activity',
                    'facilityIssue' => 'Facility Issue',
                    'wildAnimal' => 'Wild Animal',
                    'trespassing' => 'Trespassing',
                    'emergency_alert' => 'Emergency Alert',
                    'other' => 'Other',
                ];
                $categoryDisplay = $categoryLabels[$report->incidentCategory] ?? $report->incidentCategory;

                $messageText .= "{$statusIcon} {$urgencyIcon}*ID:* `{$report->reportId}`\n";
                $messageText .= "   *Status:* " . ucfirst(str_replace('_', ' ', $report->status)) . "\n";
                $messageText .= "   *Category:* {$categoryDisplay}\n";
                $messageText .= "   *Location:* " . ($report->getFullAddress() ?? 'Unknown') . "\n";
                $messageText .= "   *Reported:* " . \Carbon\Carbon::parse($report->incidentDateTime)->format('d/m/Y H:i') . "\n\n";
            }
            $messageText .= "To view details: `/report REPORT_ID`\n";
            $messageText .= "To update status: `/update REPORT_ID status`\n";
            $messageText .= "Example: `/update RPT-2024-001 resolved`";

            sendTelegramMessage($chatId, $messageText);
            return response()->json(['status' => 'ok']);
        }

        // Handle /report REPORT_ID - View specific report details
        if (preg_match('/^\/report\s+(RPT-\d{4}-\d{3})$/i', $originalText, $reportMatches)) {
            if (!$existingOfficer) {
                sendTelegramMessage($chatId, "❌ You are not registered. Please type your name to register first.");
                return response()->json(['status' => 'ok']);
            }

            $reportId = $reportMatches[1];
            $report = App\Models\Report::where('reportId', $reportId)->first();

            if (!$report) {
                sendTelegramMessage($chatId, "❌ Report `{$reportId}` not found.");
                return response()->json(['status' => 'ok']);
            }

            // Check if officer is assigned to this report
            if ($report->assignedOfficer !== $existingOfficer->officerId) {
                sendTelegramMessage($chatId, "❌ You are not assigned to report `{$reportId}`.");
                return response()->json(['status' => 'ok']);
            }

            // Get reporter info
            $reporterName = 'Unknown';
            $reporterContact = '';
            $reporterMatric = '';

            if ($report->reporter_type === 'registered' && $report->reporter_id) {
                $student = App\Models\Student::find($report->reporter_id);
                if ($student) {
                    $reporterName = $student->name;
                    $reporterContact = $student->phone;
                    $reporterMatric = $student->matrixNumber;
                }
            } elseif ($report->reporter_type === 'unregistered' && $report->reporter_id) {
                $unregistered = App\Models\UnregisteredReporter::find($report->reporter_id);
                if ($unregistered) {
                    $reporterName = $unregistered->name;
                    $reporterContact = $unregistered->phone;
                    $reporterMatric = $unregistered->matric_number;
                }
            } elseif ($report->studentId) {
                $student = App\Models\Student::find($report->studentId);
                if ($student) {
                    $reporterName = $student->name;
                    $reporterContact = $student->phone;
                    $reporterMatric = $student->matrixNumber;
                }
            }

            $categoryLabels = [
                'theft' => 'Theft/Robbery',
                'harassment' => 'Harassment',
                'vandalism' => 'Vandalism',
                'fireHazard' => 'Fire Hazard',
                'suspiciousActivity' => 'Suspicious Activity',
                'facilityIssue' => 'Facility Issue',
                'wildAnimal' => 'Wild Animal',
                'trespassing' => 'Trespassing',
                'emergency_alert' => 'Emergency Alert',
                'other' => 'Other',
            ];
            $categoryDisplay = $categoryLabels[$report->incidentCategory] ?? $report->incidentCategory;

            $statusLabels = [
                'pending' => '⏳ Pending',
                'in_progress' => '🔄 In Progress',
                'resolved' => '✅ Resolved',
                'nfa' => '📋 No Further Action'
            ];

            $messageText = "📋 *REPORT DETAILS* 📋\n\n";
            $messageText .= "*ID:* `{$report->reportId}`\n";
            $messageText .= "*Status:* " . ($statusLabels[$report->status] ?? $report->status) . "\n";
            $messageText .= "*Category:* {$categoryDisplay}\n";
            $messageText .= "*Urgency:* " . ($report->urgency === 'urgent' ? '🚨 URGENT' : 'General') . "\n\n";

            $messageText .= "*Reporter:* {$reporterName}\n";
            if ($reporterMatric) $messageText .= "*Matrix:* {$reporterMatric}\n";
            if ($reporterContact) $messageText .= "*Phone:* {$reporterContact}\n\n";

            $messageText .= "*Location:* " . ($report->getFullAddress() ?? 'Unknown') . "\n";
            $messageText .= "*Date:* " . \Carbon\Carbon::parse($report->incidentDateTime)->format('d/m/Y H:i') . "\n\n";

            if ($report->description) {
                $desc = strlen($report->description) > 300 ? substr($report->description, 0, 300) . '...' : $report->description;
                $messageText .= "*Description:*\n{$desc}\n\n";
            }

            if ($report->officerNotes) {
                $messageText .= "*Your Notes:*\n{$report->officerNotes}\n\n";
            }

            $messageText .= "To update status: `/update {$report->reportId} status`\n";
            $messageText .= "Available statuses: pending, in_progress, resolved, nfa";

            sendTelegramMessage($chatId, $messageText);
            return response()->json(['status' => 'ok']);
        }

        // Handle /update REPORT_ID STATUS - Update report status
        if (preg_match('/^\/update\s+(RPT-\d{4}-\d{3})\s+(pending|in_progress|resolved|nfa)$/i', $originalText, $updateMatches)) {
            if (!$existingOfficer) {
                sendTelegramMessage($chatId, "❌ You are not registered. Please type your name to register first.");
                return response()->json(['status' => 'ok']);
            }

            $reportId = $updateMatches[1];
            $newStatus = strtolower($updateMatches[2]);

            $report = App\Models\Report::where('reportId', $reportId)->first();

            if (!$report) {
                sendTelegramMessage($chatId, "❌ Report `{$reportId}` not found.");
                return response()->json(['status' => 'ok']);
            }

            // Check if officer is assigned to this report
            if ($report->assignedOfficer !== $existingOfficer->officerId) {
                sendTelegramMessage($chatId, "❌ You are not assigned to report `{$reportId}`.");
                return response()->json(['status' => 'ok']);
            }

            $oldStatus = $report->status;
            $report->status = $newStatus;
            $report->save();

            $statusEmoji = [
                'pending' => '⏳',
                'in_progress' => '🔄',
                'resolved' => '✅',
                'nfa' => '📋'
            ];

            $messageText = "{$statusEmoji[$newStatus]} *Report Status Updated* ✅\n\n";
            $messageText .= "*Report ID:* `{$report->reportId}`\n";
            $messageText .= "*Status changed:* " . ucfirst(str_replace('_', ' ', $oldStatus)) . " → " . ucfirst(str_replace('_', ' ', $newStatus)) . "\n";
            $messageText .= "*Updated at:* " . now()->format('d/m/Y H:i:s');

            sendTelegramMessage($chatId, $messageText);
            return response()->json(['status' => 'ok']);
        }

        // Handle /resolve or /resolved command
        if (preg_match('/^\/resolve(?:\s+(.+))?$/i', $originalText, $matches) ||
            preg_match('/^\/resolved(?:\s+(.+))?$/i', $originalText, $matches)) {

            if (!$existingOfficer) {
                sendTelegramMessage($chatId, "❌ You are not registered. Please type your name to register first.");
                return response()->json(['status' => 'ok']);
            }

            $emergencyIdentifier = trim($matches[1] ?? '');

            Log::info('🔍 RESOLVE COMMAND DEBUG', [
                'officer_id' => $existingOfficer->officerId,
                'officer_name' => $existingOfficer->officerName,
                'chat_id' => $chatId,
                'emergency_id_provided' => $emergencyIdentifier
            ]);

            $query = App\Models\Emergencies::where(function($q) use ($existingOfficer) {
                $q->where('assigned_officer_id', $existingOfficer->officerId)
                  ->orWhereNull('assigned_officer_id');
            });

            $query->whereIn('status', ['active', 'responding']);

            if (!empty($emergencyIdentifier)) {
                $query->where(function($q) use ($emergencyIdentifier) {
                    $q->where('_id', $emergencyIdentifier)
                      ->orWhere('reportId', $emergencyIdentifier);
                });
                $emergency = $query->first();
            } else {
                $emergency = App\Models\Emergencies::where('assigned_officer_id', $existingOfficer->officerId)
                    ->whereIn('status', ['active', 'responding'])
                    ->orderBy('triggeredAt', 'desc')
                    ->first();

                if (!$emergency) {
                    $emergency = App\Models\Emergencies::whereIn('status', ['active', 'responding'])
                        ->orderBy('triggeredAt', 'desc')
                        ->first();
                }
            }

            if (!$emergency) {
                $messageText = "❌ *No active emergency found*\n\n";
                $assignedCount = App\Models\Emergencies::where('assigned_officer_id', $existingOfficer->officerId)
                    ->whereIn('status', ['active', 'responding'])
                    ->count();

                $totalActive = App\Models\Emergencies::whereIn('status', ['active', 'responding'])->count();

                if ($assignedCount > 0) {
                    $messageText .= "You have {$assignedCount} active emergency(s).\n";
                    $messageText .= "Try using: `/resolve EMERGENCY_ID`\n";
                    $messageText .= "Use `/myemergencies` to see your emergency IDs.";
                } elseif ($totalActive > 0) {
                    $messageText .= "There are {$totalActive} active emergency(s) in the system, but none are assigned to you.\n\n";
                    $messageText .= "Contact dispatch to get assigned or use:\n";
                    $firstEmergency = App\Models\Emergencies::whereIn('status', ['active', 'responding'])->first();
                    if ($firstEmergency) {
                        $messageText .= "`/resolve " . $firstEmergency->_id . "`";
                    }
                } else {
                    $messageText .= "No active emergencies in the system right now.";
                }

                sendTelegramMessage($chatId, $messageText);
                return response()->json(['status' => 'ok']);
            }

            $student = null;
            if ($emergency->student_id) {
                $student = App\Models\Student::find($emergency->student_id);
            }

            if (is_null($emergency->assigned_officer_id)) {
                $emergency->assigned_officer_id = $existingOfficer->officerId;
                $emergency->assigned_officer_name = $existingOfficer->officerName;
                $emergency->assigned_at = now();
                Log::info('Auto-assigned emergency to resolving officer', [
                    'emergency_id' => $emergency->_id,
                    'officer_id' => $existingOfficer->officerId
                ]);
            }

            $oldStatus = $emergency->status;
            $emergency->status = 'resolved';
            $emergency->resolvedAt = now();
            $emergency->resolved_by_officer_id = $existingOfficer->officerId;
            $emergency->resolved_by_officer_name = $existingOfficer->officerName;
            $emergency->save();

            $successMessage = "✅ *Emergency Resolved!*\n\n";
            $successMessage .= "You have successfully resolved the emergency.\n";
            $successMessage .= "*ID:* `{$emergency->_id}`\n";
            $successMessage .= "*Location:* " . ($emergency->address ?? 'Unknown') . "\n";
            $successMessage .= "*Status changed:* " . ucfirst($oldStatus) . " → Resolved\n";
            $successMessage .= "*Resolved at:* " . now()->format('d/m/Y H:i:s');

            sendTelegramMessage($chatId, $successMessage);

            try {
                Http::put(url("/api/emergencies/{$emergency->_id}/resolve"));
                Log::info('Emergency resolved via API', [
                    'emergency_id' => $emergency->_id,
                    'officer' => $existingOfficer->officerName
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to update emergency via API: ' . $e->getMessage());
            }

            return response()->json(['status' => 'ok']);
        }

        // Handle /help command
        if ($text === '/help') {
            $messageText = "📋 *Available Commands*\n\n";
            $messageText .= "*Emergency Commands:*\n";
            $messageText .= "`/myemergencies` - List your active emergencies\n";
            $messageText .= "`/resolve [ID]` - Resolve an emergency\n\n";
            $messageText .= "*Report Commands:*\n";
            $messageText .= "`/myreports` - List your assigned reports\n";
            $messageText .= "`/report REPORT_ID` - View report details\n";
            $messageText .= "`/update REPORT_ID status` - Update report status\n\n";
            $messageText .= "*General:*\n";
            $messageText .= "`/start` - Start the bot\n";
            $messageText .= "`/myid` - Show your Chat ID\n";
            $messageText .= "`/status` - Check registration status\n";
            $messageText .= "`/help` - Show this help message\n\n";

            if ($existingOfficer) {
                $messageText .= "✅ You are registered as: *{$existingOfficer->officerName}*\n";
            } else {
                $messageText .= "❌ You are not registered. Type your *full name* to register.";
            }

            sendTelegramMessage($chatId, $messageText);
            return response()->json(['status' => 'ok']);
        }

        // AUTO-REGISTRATION: Try to find matching officer by name
        if (!$existingOfficer && strlen($text) > 3 && !str_starts_with($text, '/')) {
            Log::info('Searching for officer with name: ' . $text);

            $matchedOfficer = App\Models\Officer::whereRaw([
                '$or' => [
                    ['officerName' => ['$regex' => '^' . preg_quote($text, '/') . '$', '$options' => 'i']],
                    ['officerName' => ['$regex' => preg_quote($text, '/'), '$options' => 'i']],
                    ['officerId' => ['$regex' => preg_quote($text, '/'), '$options' => 'i']]
                ]
            ])->first();

            if ($matchedOfficer) {
                $matchedOfficer->telegram_chat_id = (string)$chatId;
                $matchedOfficer->receive_emergency = true;
                $matchedOfficer->save();

                $successMessage = "✅ *Registration Successful!*\n\n";
                $successMessage .= "You have been registered as:\n";
                $successMessage .= "*Name:* {$matchedOfficer->officerName}\n";
                $successMessage .= "*Rank:* {$matchedOfficer->rank}\n";
                $successMessage .= "*Department:* {$matchedOfficer->department}\n\n";
                $successMessage .= "You will now receive emergency notifications ONLY when dispatched.\n";
                $successMessage .= "Type `/status` to see your registration details.\n";
                $successMessage .= "Type `/help` to see all commands.\n\n";
                $successMessage .= "📋 *Report Commands:*\n";
                $successMessage .= "`/myreports` - List your assigned reports\n";
                $successMessage .= "`/report REPORT_ID` - View report details\n";
                $successMessage .= "`/update REPORT_ID status` - Update report status";

                sendTelegramMessage($chatId, $successMessage);

                Log::info("New officer registered via Telegram", [
                    'officer_id' => $matchedOfficer->officerId,
                    'officer_name' => $matchedOfficer->officerName,
                    'chat_id' => $chatId
                ]);
            } else {
                $messageText = "❌ *No officer found* with name matching '{$text}'.\n\n";
                $messageText .= "Please check your name and try again.\n";
                $messageText .= "Make sure your name is exactly as registered in the system.\n\n";
                $messageText .= "Your Chat ID is: `{$chatId}`\n\n";
                $messageText .= "Contact your administrator if you need assistance.";

                sendTelegramMessage($chatId, $messageText);
            }
            return response()->json(['status' => 'ok']);
        }

        if (!$existingOfficer) {
            $messageText = "👋 Welcome! To get started, please type your *full name* to register.\n\n";
            $messageText .= "Example: `Ahmad Bin Abdullah` or `Senior Security Officer`\n\n";
            $messageText .= "Type `/help` to see all commands.";
            sendTelegramMessage($chatId, $messageText);
        }

        return response()->json(['status' => 'ok']);
    }

    return response()->json(['status' => 'ok']);
});

// ============================================
// PUBLIC ROUTES
// ============================================

Route::get('/',          [AdminAuthController::class, 'showLogin'])->name('login');
Route::get('/register',  [AdminAuthController::class, 'showRegister'])->name('register');
Route::post('/login',    [AdminAuthController::class, 'login']);
Route::post('/register', [AdminAuthController::class, 'register']);
Route::post('/logout',   [AdminAuthController::class, 'logout'])->name('logout');

// ============================================
// PROTECTED ROUTES (Auth Required)
// ============================================

Route::middleware('auth')->group(function () {

    Route::get('/Dashboard',  fn() => Inertia::render('Dashboard'))->name('dashboard');
    Route::get('/Alerts',     fn() => Inertia::render('Alerts'))->name('alerts');
    Route::get('/Settings',   fn() => Inertia::render('Settings'))->name('settings');

    Route::get('/dashboard/recent-data', [DashboardController::class, 'getRecentReports'])->name('dashboard.recent');

    Route::get('/Reports',    [ReportController::class, 'index'])->name('reports');
    Route::get('/Reports/recent', [ReportController::class, 'getRecent'])->name('reports.recent');
    Route::post('/Reports',   [ReportController::class, 'store'])->name('reports.store');
    Route::put('/Reports/{reportId}', [ReportController::class, 'update'])->name('reports.update');
    Route::delete('/Reports/{reportId}', [ReportController::class, 'destroy'])->name('reports.destroy');
    Route::get('/reports/{reportId}/attachments', [ReportController::class, 'getAttachments'])->name('reports.attachments');
    Route::post('/reports/upload-attachments', [ReportController::class, 'uploadAttachments'])->name('reports.upload.attachments');
    Route::post('/reports/upload-for-new', [ReportController::class, 'uploadForNewReport'])->name('reports.upload-for-new');
    Route::delete('/reports/delete-attachment', [ReportController::class, 'deleteAttachment'])->name('reports.delete.attachment');

    Route::get('/Officers', [OfficerController::class, 'index'])->name('officers');
    Route::post('/Officers', [OfficerController::class, 'store'])->name('officers.store');
    Route::put('/Officers/{officerId}', [OfficerController::class, 'update'])->name('officers.update');
    Route::delete('/Officers/{officerId}', [OfficerController::class, 'destroy'])->name('officers.destroy');
    Route::get('/api/officers/list', [OfficerController::class, 'getOfficersList'])->name('api.officers.list');

    Route::get('/Heatmap', [MapController::class, 'index'])->name('heatmap');
    Route::get('/heatmap-data', [MapController::class, 'getHeatmapData'])->name('heatmap.data');

    Route::get('/Statistics', [StatisticsController::class, 'index'])->name('statistics');

    Route::put('/settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.profile');
    Route::put('/settings/password', [SettingsController::class, 'changePassword'])->name('settings.password');
    Route::post('/settings/two-factor', [SettingsController::class, 'toggleTwoFactor'])->name('settings.two-factor');
    Route::post('/logout-all', [SettingsController::class, 'logoutAllDevices'])->name('logout-all');
    Route::post('/digest/send', [DigestController::class, 'send']);
    Route::post('/settings/notification-preferences', [SettingsController::class, 'updateNotificationPreferences']);
    Route::get('/settings/notification-preferences', [SettingsController::class, 'getNotificationPreferences']);
    Route::post('/settings/dark-mode', [SettingsController::class, 'updateDarkMode']);
    Route::get('/settings/dark-mode', [SettingsController::class, 'getDarkMode']);

    Route::get('/api/pending-admins', function () {
        return App\Models\Admins::where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();
    });

    // ============================================
    // STUDENT SEARCH
    // ============================================

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

    Route::put('/admin/update-status/{adminId}', [AdminAuthController::class, 'updateStatus']);
    Route::put('/admin/approve/{adminId}', [AdminAuthController::class, 'approve']);
    Route::put('/admin/reject/{adminId}', [AdminAuthController::class, 'reject']);
    Route::get('/Approvals', function () {
        $allAdmins = App\Models\Admins::orderBy('created_at', 'desc')->get();
        return Inertia::render('Approvals', ['allAdmins' => $allAdmins]);
    })->name('approvals');

    Route::get('/api/notifications', [NotificationController::class, 'index']);
    Route::get('/api/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::put('/api/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/api/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    Route::get('/api/emergencies', [EmergencyController::class, 'index']);
    Route::get('/api/emergencies/counts', [EmergencyController::class, 'getActiveCount']);
    Route::put('/api/emergencies/{id}/dispatch', [EmergencyController::class, 'dispatch']);
    Route::put('/api/emergencies/{id}/resolve', [EmergencyController::class, 'resolve']);
    Route::put('/api/emergencies/{id}/revert', [EmergencyController::class, 'revert']);
    Route::delete('/api/emergencies/{id}', [EmergencyController::class, 'destroy']);
    Route::post('/api/emergencies/bulk-delete', [EmergencyController::class, 'bulkDelete']);
    Route::put('/api/emergencies/{id}/live-location', [EmergencyController::class, 'updateLiveLocation']);
    Route::get('/api/emergencies/{id}/live-location', [EmergencyController::class, 'getLiveLocation']);
    Route::post('/api/emergencies/{id}/start-tracking', [EmergencyController::class, 'startLiveTracking']);

    Route::prefix('api/safety-tips')->group(function () {
        Route::post('/send', [App\Http\Controllers\SafetyTipsController::class, 'send']);
        Route::get('/history', [App\Http\Controllers\SafetyTipsController::class, 'history']);
        Route::get('/{id}', [App\Http\Controllers\SafetyTipsController::class, 'show']);
    });

    Route::post('/password/send-code', [PasswordChangeController::class, 'sendCode']);
    Route::post('/password/verify-change', [PasswordChangeController::class, 'verifyAndChange']);
    Route::post('/password/resend-code', [PasswordChangeController::class, 'resendCode']);
});

// ============================================
// FALLBACK ROUTE
// ============================================

Route::fallback(function () {
    return Inertia::render('NotFound');
});
