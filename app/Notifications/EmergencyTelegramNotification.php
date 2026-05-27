<?php
// app/Notifications/EmergencyTelegramNotification.php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EmergencyTelegramNotification extends Notification
{
    use Queueable;

    protected $emergency;
    protected $student;
    protected $type;

    public function __construct($emergency, $student, $type = 'new')
    {
        $this->emergency = $emergency;
        $this->student = $student;
        $this->type = $type;
    }

    public function via($notifiable)
    {
        return ['telegram'];
    }

    public function toTelegram($notifiable)
    {
        $token = env('TELEGRAM_BOT_TOKEN');
        $chatId = $notifiable->telegram_chat_id;
        $officerName = $notifiable->officerName ?? 'Officer';

        if (!$chatId) {
            Log::warning('No Telegram chat ID for officer: ' . ($notifiable->officerName ?? 'Unknown'));
            return null;
        }

        $message = $this->buildMessage($officerName);

        try {
            $response = Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'Markdown'
            ]);

            Log::info('Telegram message sent via Notification class', [
                'chat_id' => $chatId,
                'officer' => $officerName,
                'type' => $this->type,
                'success' => $response->successful()
            ]);

            return $response;
        } catch (\Exception $e) {
            Log::error('Failed to send Telegram message: ' . $e->getMessage());
            return null;
        }
    }

    private function buildMessage($officerName)
    {
        // Safely get values with fallbacks
        $studentName = $this->student->name ?? $this->student->studentName ?? 'Unknown';
        $matrixNumber = $this->student->matrixNumber ?? $this->student->studentMatrix ?? 'N/A';
        $phone = $this->student->phone ?? $this->student->studentPhone ?? 'N/A';

        $location = 'Unknown';
        if ($this->emergency) {
            $location = $this->emergency->address ??
                       ($this->emergency->location['mahallah'] ??
                       ($this->emergency->mahallah ?? 'Unknown'));
        }

        $time = now()->format('d/m/Y H:i:s');
        if ($this->emergency && isset($this->emergency->triggeredAt)) {
            $time = $this->emergency->triggeredAt instanceof \DateTime
                ? $this->emergency->triggeredAt->format('d/m/Y H:i:s')
                : date('d/m/Y H:i:s', strtotime($this->emergency->triggeredAt));
        }

        if ($this->type === 'new') {
            return "🚨 *EMERGENCY ALERT* 🚨\n\n" .
                   "*Student:* {$studentName}\n" .
                   "*Matrix:* {$matrixNumber}\n" .
                   "*Phone:* {$phone}\n" .
                   "*Location:* {$location}\n" .
                   "*Time:* {$time}\n\n" .
                   "⚠️ *URGENT: Immediate action required!*";

        } elseif ($this->type === 'dispatched') {
            $assignedOfficer = $this->emergency->assigned_officer_name ?? '';

            // Check if this message is for the assigned officer
            if (!empty($assignedOfficer) && strcasecmp(trim($assignedOfficer), trim($officerName)) === 0) {
                // This IS the assigned officer - task assignment message
                return "👮 *TASK ASSIGNED TO YOU* 👮\n\n" .
                       "*{$officerName}*, you have been assigned to an emergency.\n\n" .
                       "*Student:* {$studentName}\n" .
                       "*Matrix:* {$matrixNumber}\n" .
                       "*Phone:* {$phone}\n" .
                       "*Location:* {$location}\n" .
                       "*Reported at:* {$time}\n\n" .
                       "📋 *Your Task:*\n" .
                       "• Respond to the location immediately\n" .
                       "• Assess the situation\n" .
                       "• Provide assistance to the student\n" .
                       "• Update the status when resolved\n\n" .
                       "⚠️ *Please respond to this emergency as soon as possible!*";
            } else {
                // This is for OTHER officers - informational only
                return "👮 *OFFICER DISPATCHED* 👮\n\n" .
                       "*Student:* {$studentName}\n" .
                       "*Assigned Officer:* " . ($assignedOfficer ?: 'An officer') . "\n" .
                       "*Location:* {$location}\n\n" .
                       "✅ An officer has been dispatched to handle this emergency.";
            }

        } elseif ($this->type === 'resolved') {
            return "✅ *EMERGENCY RESOLVED* ✅\n\n" .
                   "*Student:* {$studentName}\n" .
                   "*Status:* Emergency has been marked as resolved\n" .
                   "*Time:* " . now()->format('d/m/Y H:i:s') . "\n\n" .
                   "The situation has been handled. Good work, {$officerName}!";
        }

        return "Emergency notification from security system.";
    }
}
