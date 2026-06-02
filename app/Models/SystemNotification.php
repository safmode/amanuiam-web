<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SystemNotification extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'notifications';

    protected $fillable = [
        'type',
        'title',
        'message',
        'report_id',
        'report_title',
        'status',
        'read_by',
        'created_at',
        'updated_at',
        // ✅ ADD THESE STUDENT FIELDS
        'student_id',
        'student_name',
        'student_matrix',
        'student_phone',
        'location',
        'latitude',
        'longitude'
    ];

    protected $casts = [
        'read_by' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function markAsRead($userId)
    {
        $readBy = $this->read_by ?? [];
        if (!in_array($userId, $readBy)) {
            $readBy[] = $userId;
            $this->read_by = $readBy;
            $this->save();
        }
    }

    public function isReadBy($userId)
    {
        $readBy = $this->read_by ?? [];
        return in_array($userId, $readBy);
    }

    public static function getUnreadCount($userId)
    {
        $allNotifications = self::all();
        $unreadCount = 0;

        foreach ($allNotifications as $notification) {
            $readBy = $notification->read_by ?? [];
            if (!in_array($userId, $readBy)) {
                $unreadCount++;
            }
        }

        return $unreadCount;
    }

    public static function createUnique($data)
    {
        $existing = self::where('report_id', $data['report_id'])
            ->where('created_at', '>', now()->subSeconds(5))
            ->first();

        if ($existing) {
            return $existing;
        }

        return self::create($data);
    }
}
