<?php
// app/Events/NotificationSent.php

namespace App\Events;

use App\Models\SystemNotification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;
    public $userId;

    public function __construct($notification, $userId)
    {
        $this->notification = $notification;
        $this->userId = $userId;
    }

    public function broadcastOn()
    {
        return [new Channel('admin-notifications')];
    }

    public function broadcastAs()
    {
        return 'notification.received';
    }

    public function broadcastWith()
    {
        return [
            'notification' => [
                '_id' => (string)$this->notification->_id,
                'type' => $this->notification->type,
                'title' => $this->notification->title,
                'message' => $this->notification->message,
                'report_id' => $this->notification->report_id,
                'created_at' => $this->notification->created_at->toIso8601String(),
            ],
            'unread_count' => SystemNotification::whereRaw([
                'read_by' => ['$ne' => $this->userId]
            ])->count()
        ];
    }
}
