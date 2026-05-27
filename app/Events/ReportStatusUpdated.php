<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel; // Use PrivateChannel
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class ReportStatusUpdated implements ShouldBroadcast
{
    public $report;
    public $userId; // The ID of the user who owns the report

    public function __construct($report, $userId)
    {
        $this->report = $report;
        $this->userId = $userId;
    }

    // 🚀 CRITICAL: Broadcast to a channel ONLY this user can access
    public function broadcastOn()
    {
        // Channel name format: private-user.{userId}
        return [new PrivateChannel('user.' . $this->userId)];
    }

    // Optional: Rename the event for the frontend
    public function broadcastAs()
    {
        return 'report.updated';
    }

    // Data sent to the user
    public function broadcastWith()
    {
        return [
            'id' => $this->report->reportId,
            'status' => $this->report->status,
            'updated_at' => now()
        ];
    }
}
