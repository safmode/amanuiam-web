<?php

namespace App\Http\Controllers;

use App\Models\SystemNotification;
use App\Models\Admins;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Events\NotificationSent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Category labels mapping for display
     */
    private static function getCategoryLabel($category)
    {
        $labels = [
            'theft' => 'Theft/Robbery',
            'harassment' => 'Harassment',
            'vandalism' => 'Vandalism',
            'fireHazard' => 'Fire Hazard',
            'suspiciousActivity' => 'Suspicious Activity',
            'facilityIssue' => 'Facility Issue',
            'wildAnimal' => 'Wild Animal',
            'trespassing' => 'Trespassing',
            'emergencyAlert' => 'Emergency Alert',
            'other' => 'Other',
        ];

        return $labels[$category] ?? ucfirst(str_replace('_', ' ', $category));
    }

    /**
     * Get all notifications for the authenticated admin
     */
    public function index(): JsonResponse
    {
        try {
            $admin = Auth::user();
            $userId = (string)$admin->_id;

            $preferences = $admin->notification_preferences ?? [];
            $wantsAlerts = $preferences['incident_alerts'] ?? true;

            if (!$wantsAlerts) {
                return response()->json(['notifications' => [], 'unread_count' => 0]);
            }

            $notifications = SystemNotification::orderBy('created_at', 'desc')->get();
            $unreadCount = 0;
            $notificationsArray = [];

            foreach ($notifications as $notification) {
                $readBy = $notification->read_by ?? [];
                $isRead = in_array($userId, $readBy);

                if (!$isRead) {
                    $unreadCount++;
                }

                $notificationsArray[] = [
                    '_id' => $notification->_id,
                    'type' => $notification->type,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'report_id' => $notification->report_id,
                    'report_title' => $notification->report_title,
                    'status' => $notification->status,
                    'read_by' => $readBy,
                    'created_at' => $notification->created_at,
                    'is_read' => $isRead
                ];
            }

            return response()->json([
                'notifications' => $notificationsArray,
                'unread_count' => $unreadCount
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching notifications: ' . $e->getMessage());
            return response()->json(['notifications' => [], 'unread_count' => 0]);
        }
    }

    /**
     * Get unread count for the authenticated admin
     */
    public function getUnreadCount(): JsonResponse
    {
        try {
            $admin = Auth::user();
            $userId = (string)$admin->_id;

            $preferences = $admin->notification_preferences ?? [];
            $wantsAlerts = $preferences['incident_alerts'] ?? true;

            if (!$wantsAlerts) {
                return response()->json(['unread_count' => 0]);
            }

            $notifications = SystemNotification::all();
            $unreadCount = 0;

            foreach ($notifications as $notification) {
                $readBy = $notification->read_by ?? [];
                if (!in_array($userId, $readBy)) {
                    $unreadCount++;
                }
            }

            return response()->json(['unread_count' => $unreadCount]);
        } catch (\Exception $e) {
            Log::error('Error fetching unread count: ' . $e->getMessage());
            return response()->json(['unread_count' => 0]);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead()
    {
        try {
            $admin = Auth::user();
            $userId = (string)$admin->_id;

            $notifications = SystemNotification::all();

            foreach ($notifications as $notification) {
                $readBy = $notification->read_by ?? [];
                if (!in_array($userId, $readBy)) {
                    $readBy[] = $userId;
                    $notification->read_by = $readBy;
                    $notification->save();
                }
            }

            return redirect()->back();
        } catch (\Exception $e) {
            Log::error('Failed to mark all as read: ' . $e->getMessage());
            return redirect()->back();
        }
    }

    /**
     * Mark a single notification as read
     */
    public function markAsRead($id)
    {
        try {
            $admin = Auth::user();
            $userId = (string)$admin->_id;

            $notification = SystemNotification::find($id);

            if ($notification) {
                $readBy = $notification->read_by ?? [];
                if (!in_array($userId, $readBy)) {
                    $readBy[] = $userId;
                    $notification->read_by = $readBy;
                    $notification->save();
                }
            }

            return redirect()->back();
        } catch (\Exception $e) {
            Log::error('Failed to mark as read: ' . $e->getMessage());
            return redirect()->back();
        }
    }

    /**
     * CREATE URGENT ALERT NOTIFICATION
     * This is called from EmergencyController@store
     */
    public static function createEmergencyAlert($emergency, $student = null): ?SystemNotification
    {
        try {
            $studentName = $student ? $student->name : 'Unknown Student';
            $location = $emergency->address ?? 'Unknown location';
            $emergencyId = substr((string)$emergency->_id, -6);

            $notification = SystemNotification::create([
                'type' => 'emergency_alert',
                'title' => '⚠️ URGENT',
                'message' => "Urgent Report from {$studentName} at {$location}",
                'report_id' => 'EMERG-' . $emergencyId,
                'report_title' => "Urgent Report at {$location}",
                'status' => $emergency->status,
                'read_by' => [],
                'created_at' => now()
            ]);

            self::broadcastToAdmins($notification);

            Log::info('Emergency notification created', [
                'notification_id' => (string)$notification->_id,
                'emergency_id' => (string)$emergency->_id
            ]);

            return $notification;
        } catch (\Exception $e) {
            Log::error('Failed to create emergency notification: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * CREATE NEW REPORT NOTIFICATION
     */
    public static function createNewReport($report): ?SystemNotification
    {
        try {
            $formattedCategory = self::getCategoryLabel($report->incidentCategory);

            $notification = SystemNotification::create([
                'type' => 'new_report',
                'title' => '📋 New Report Submitted',
                'message' => "New {$formattedCategory} report",
                'report_id' => $report->reportId,
                'report_title' => $report->description ?? 'No description',
                'read_by' => [],
                'created_at' => now()
            ]);

            self::broadcastToAdmins($notification);

            return $notification;
        } catch (\Exception $e) {
            Log::error('Failed to create new report notification: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Broadcast notification to all admins
     */
    private static function broadcastToAdmins($notification): void
    {
        if (!in_array($notification->type, ['new_report', 'emergency_alert'])) {
            return;
        }

        try {
            $admins = Admins::all();
            foreach ($admins as $admin) {
                broadcast(new NotificationSent($notification, (string)$admin->_id));
            }
            Log::info('Broadcast sent for notification: ' . $notification->type);
        } catch (\Exception $e) {
            Log::error('Failed to broadcast notification: ' . $e->getMessage());
        }
    }

    /**
     * CREATE STATUS CHANGE NOTIFICATION
     * This is called when a report's status is updated
     */
    public static function createStatusChange($report, $oldStatus, $newStatus): ?SystemNotification
    {
        try {
            $statusLabels = [
                'pending' => 'Pending',
                'inProgress' => 'In Progress',
                'resolved' => 'Resolved',
                'nfa' => 'No Further Action'
            ];

            $oldStatusLabel = $statusLabels[$oldStatus] ?? ucfirst($oldStatus);
            $newStatusLabel = $statusLabels[$newStatus] ?? ucfirst($newStatus);

            $notification = SystemNotification::create([
                'type' => 'status_change',
                'title' => '📝 Report Status Updated',
                'message' => "Report #{$report->reportId} status changed from {$oldStatusLabel} to {$newStatusLabel}",
                'report_id' => $report->reportId,
                'report_title' => $report->description ?? 'No description',
                'status' => $newStatus,
                'read_by' => [],
                'created_at' => now()
            ]);

            self::broadcastToAdmins($notification);

            Log::info('Status change notification created', [
                'notification_id' => (string)$notification->_id,
                'report_id' => $report->reportId,
                'old_status' => $oldStatus,
                'new_status' => $newStatus
            ]);

            return $notification;
        } catch (\Exception $e) {
            Log::error('Failed to create status change notification: ' . $e->getMessage());
            return null;
        }
    }
}
