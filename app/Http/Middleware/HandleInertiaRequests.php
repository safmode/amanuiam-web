<?php

namespace App\Http\Middleware;

use App\Models\Emergencies;
use App\Models\Officer;
use App\Models\Notification;
use App\Models\Report;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 10);

        // Get dashboard data
        $recentReports = Report::with(['student', 'assignedOfficerData'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        $stats = [
            'totalReports' => Report::count(),
            'pendingReports' => Report::where('status', 'pending')->count(),
            'inProgressReports' => Report::where('status', 'in_progress')->count(),
            'resolvedReports' => Report::where('status', 'resolved')->count(),
            'nfaReports' => Report::where('status', 'nfa')->count(),
            'emergencyAlerts' => Emergencies::where('status', 'active')->count(),
        ];

        // Generate hotspots from reports
        $hotspots = $this->generateHotspotsFromReports($recentReports);

        // Get paginated emergencies
        $emergenciesQuery = Emergencies::orderBy('triggeredAt', 'desc');
        $total = $emergenciesQuery->count();
        $lastPage = ceil($total / $perPage);
        $from = ($page - 1) * $perPage + 1;
        $to = min($page * $perPage, $total);

        $alertsData = [
            'data' => $emergenciesQuery->skip(($page - 1) * $perPage)->take($perPage)->get(),
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => (int)$perPage,
                'total' => $total,
                'last_page' => $lastPage,
                'from' => $from > $total ? null : $from,
                'to' => $to < 1 ? null : $to,
            ]
        ];

        $emergencyStats = [
            'active' => Emergencies::where('status', 'active')->count(),
            'responding' => Emergencies::where('status', 'responding')->count(),
            'resolved' => Emergencies::where('status', 'resolved')->count(),
        ];

        // Get officers list for dispatch modal
        $officersList = Officer::where('status', 'active')
            ->select('officerId', 'officerName', 'rank', 'department', 'phone', 'email')
            ->get();

        // Get notifications for header
        $notifications = [];
        $unreadCount = 0;
        if ($user) {
            $notifications = Notification::where('user_id', $user->_id ?? $user->id)
                ->orderBy('created_at', 'desc')
                ->take(50)
                ->get();
            $unreadCount = Notification::where('user_id', $user->_id ?? $user->id)
                ->where('is_read', false)
                ->count();
        }

        return array_merge(parent::share($request), [
            'auth' => [
                'admins' => $user ? [
                    'id' => $user->_id ?? $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone ?? '',
                    'rank' => $user->rank,
                    'department' => $user->department,
                    'status' => $user->status,
                    'role' => $user->role ?? 'admin',
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            // Dashboard data
            'dashboardData' => [
                'recentReports' => $recentReports,
                'stats' => $stats,
                'hotspots' => $hotspots,
                'lastUpdated' => now(),
            ],
            // Alerts data
            'alertsData' => $alertsData,
            'emergencyStats' => $emergencyStats,
            // Dark mode preference
            'darkMode' => fn () => $user
                ? ($user->notification_preferences['dark_mode'] ?? false)
                : false,
            // Officers list for dispatch modal
            'officersList' => $officersList,
            // Notifications for header
            'notifications' => [
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
            ],
            // Safety tips data (if needed)
            'safetyTips' => fn () => \App\Models\SystemNotification::where('type', 'like', 'safety_%')
                ->orderBy('created_at', 'desc')
                ->paginate(20),
        ]);
    }

    /**
     * Generate hotspots from reports
     */
    private function generateHotspotsFromReports($reports)
    {
        $locationMap = [];

        foreach ($reports as $report) {
            $locationName = $report->locationArea ?? $report->mahallah;
            if (!$locationName) continue;

            if (!isset($locationMap[$locationName])) {
                $locationMap[$locationName] = [
                    'location' => $locationName,
                    'incidents' => 0,
                    'breakdown' => []
                ];
            }

            $locationMap[$locationName]['incidents']++;
            $category = $report->incidentCategory ?? 'other';
            $locationMap[$locationName]['breakdown'][$category] =
                ($locationMap[$locationName]['breakdown'][$category] ?? 0) + 1;
        }

        usort($locationMap, fn($a, $b) => $b['incidents'] - $a['incidents']);

        return array_slice($locationMap, 0, 5);
    }
}
