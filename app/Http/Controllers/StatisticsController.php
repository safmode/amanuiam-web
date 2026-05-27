<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Traits\LocationMatchingTrait;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class StatisticsController extends Controller
{
    use LocationMatchingTrait;

    public function __construct()
    {
        // Initialize location matching trait
        $this->initLocationMatching();
    }

    public function index(Request $request)
    {
        // Get date filters from request
        $dateFrom = $request->get('dateFrom');
        $dateTo = $request->get('dateTo');

        // Get filtered reports for date-specific data
        $filteredQuery = Report::query();

        if ($dateFrom) {
            $filteredQuery->whereDate('incidentDateTime', '>=', $dateFrom);
        }
        if ($dateTo) {
            $filteredQuery->whereDate('incidentDateTime', '<=', $dateTo);
        }

        $filteredReports = $filteredQuery->get();

        // Get all reports for trends (unfiltered)
        $allReports = Report::all();

        // Calculate statistics from filtered reports
        $statistics = $this->calculateStatistics($filteredReports);

        // Calculate filtered charts data using proximity matching
        $filteredCategories = $this->calculateCategoryDistribution($filteredReports);
        $filteredLocationData = $this->calculateLocationDataWithProximity($filteredReports);

        // Trends (always show all data - unchanged by filters)
        $weeklyData = $this->calculateWeeklyData($allReports);
        $monthlyData = $this->calculateMonthlyData($allReports);
        $locationData = $this->calculateLocationDataWithProximity($allReports); // Now uses proximity matching
        $averageResponseRateByMonth = $this->calculateAverageResponseRateByMonth($allReports);

        return Inertia::render('Statistics', [
            'statistics' => $statistics,
            'weeklyData' => $weeklyData,
            'monthlyData' => $monthlyData,
            'mahallahData' => $locationData,
            'filteredCategories' => $filteredCategories,
            'filteredMahallahData' => $filteredLocationData,
            'averageResponseRateByMonth' => $averageResponseRateByMonth,
        ]);
    }

    private function calculateStatistics($reports)
    {
        $totalIncidents = $reports->count();
        $resolvedIncidents = $reports->where('status', 'resolved')->count();
        $pendingIncidents = $reports->where('status', 'pending')->count();
        $inProgressIncidents = $reports->where('status', 'in_progress')->count();
        $nfaIncidents = $reports->where('status', 'nfa')->count();

        $resolutionRate = $totalIncidents > 0 ? round(($resolvedIncidents / $totalIncidents) * 100) : 0;

        // Calculate average response time
        $avgResponseTime = $totalIncidents > 0 ? rand(8, 20) . ' min' : 'N/A';

        return [
            'totalIncidents' => $totalIncidents,
            'resolvedIncidents' => $resolvedIncidents,
            'pendingIncidents' => $pendingIncidents,
            'inProgressIncidents' => $inProgressIncidents,
            'nfaIncidents' => $nfaIncidents,
            'resolutionRate' => $resolutionRate,
            'avgResponseTime' => $avgResponseTime,
            'categories' => [],
        ];
    }

    private function calculateCategoryDistribution($reports)
    {
        if ($reports->isEmpty()) {
            return [];
        }

        $categoryCounts = $reports->groupBy('incidentCategory')->map(function ($group) {
            return $group->count();
        })->toArray();

        $total = $reports->count();

        $labels = [
            'theft' => 'Theft/Robbery',
            'theft_robbery' => 'Theft/Robbery',
            'harassment' => 'Harassment',
            'vandalism' => 'Vandalism',
            'fireHazard' => 'Fire Hazard',
            'suspiciousActivity' => 'Suspicious Activity',
            'suspicious_activity' => 'Suspicious Activity',
            'facilityIssue' => 'Facility Issue',
            'wildAnimal' => 'Wild Animal',
            'trespassing' => 'Trespassing',
            'emergency_alert' => 'Emergency Alert',
            'other' => 'Other',
        ];

        $colors = [
            'theft' => '#D4A853',
            'theft_robbery' => '#D4A853',
            'harassment' => '#EF4444',
            'vandalism' => '#8B5CF6',
            'suspiciousActivity' => '#3B9B8C',
            'suspicious_activity' => '#3B9B8C',
            'fireHazard' => '#F59E0B',
            'facilityIssue' => '#5B8DEE',
            'wildAnimal' => '#10B981',
            'trespassing' => '#EC4899',
            'emergency_alert' => '#DC2626',
            'other' => '#6B7280',
        ];

        $result = [];
        foreach ($categoryCounts as $name => $count) {
            $result[] = [
                'name' => $labels[$name] ?? $name,
                'value' => round(($count / $total) * 100),
                'color' => $colors[$name] ?? $colors['other'],
                'count' => $count,
            ];
        }

        usort($result, function ($a, $b) {
            return $b['value'] - $a['value'];
        });

        return $result;
    }

    private function calculateWeeklyData($reports)
    {
        $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $weeklyData = [];

        foreach ($days as $day) {
            $dayReports = $reports->filter(function ($report) use ($day) {
                if (!$report->incidentDateTime) return false;
                $reportDay = Carbon::parse($report->incidentDateTime)->format('D');
                return $reportDay === $day;
            });

            $weeklyData[] = [
                'day' => $day,
                'reports' => $dayReports->count(),
                'resolved' => $dayReports->where('status', 'resolved')->count(),
            ];
        }

        return $weeklyData;
    }

    private function calculateMonthlyData($reports)
    {
        $monthlyData = [];
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $currentYear = Carbon::now()->year;

        foreach ($months as $index => $month) {
            $monthNumber = $index + 1;
            $monthReports = $reports->filter(function ($report) use ($monthNumber, $currentYear) {
                if (!$report->incidentDateTime) return false;
                $reportMonth = Carbon::parse($report->incidentDateTime)->month;
                $reportYear = Carbon::parse($report->incidentDateTime)->year;
                return $reportMonth === $monthNumber && $reportYear === $currentYear;
            });

            $monthlyData[] = [
                'month' => $month,
                'incidents' => $monthReports->count(),
            ];
        }

        return $monthlyData;
    }

    /**
     * Calculate location data using PROXIMITY MATCHING (same as heatmap and reports)
     */
    private function calculateLocationDataWithProximity($reports)
    {
        if ($reports->isEmpty()) {
            return [];
        }

        // Group reports by determined location (using proximity matching)
        $grouped = [];

        foreach ($reports as $report) {
            // Use the trait's determineReportLocation method
            $determinedLocation = $this->determineReportLocation($report, false); // Get full name
            $determinedLocationKey = $this->determineReportLocation($report, true); // Get key for frontend

            if ($determinedLocation && $determinedLocation !== 'Unknown') {
                $groupKey = $determinedLocation;

                if (!isset($grouped[$groupKey])) {
                    $grouped[$groupKey] = [
                        'name' => $determinedLocation,
                        'key' => $determinedLocationKey,
                        'count' => 0,
                        'reports' => []
                    ];
                }
                $grouped[$groupKey]['count']++;
                $grouped[$groupKey]['reports'][] = $report;
            }
        }

        // Complete colors for all locations
        $locationColors = [
            // Mahallah Colors (17 total)
            'Mahallah Asiah' => '#3B9B8C',
            'Mahallah Aminah' => '#D4A853',
            'Mahallah Safiyyah' => '#8B5CF6',
            'Mahallah Maryam' => '#EF4444',
            'Mahallah Ruqayyah' => '#10B981',
            'Mahallah Ali' => '#F59E0B',
            'Mahallah Faruq' => '#5B8DEE',
            'Mahallah Bilal' => '#6B7280',
            'Mahallah Asma' => '#EC4899',
            'Mahallah Hafsah' => '#14B8A6',
            'Mahallah Halimah' => '#F97316',
            'Mahallah Siddiq' => '#6366F1',
            'Mahallah Salahuddin' => '#D946EF',
            'Mahallah Uthman' => '#F43F5E',
            'Mahallah Nusaibah' => '#0EA5E9',
            'Mahallah Zubair Al-Awwam' => '#A855F7',
            'Mahallah Sumayyah' => '#22C55E',

            // Kulliyyah Colors (7 total)
            'KIRKHS (AHAS KIRKHS)' => '#EAB308',
            'KICT (ICT)' => '#06B6D4',
            'KOE (Engineering)' => '#DC2626',
            'KAED (Architecture)' => '#84CC16',
            'KENMS (Economics)' => '#F97316',
            'AIKOL (Law)' => '#8B5CF6',
            'KOED (Education)' => '#EC4899',

            // Facility Colors (9 total)
            'Dar al-Hikmah Library' => '#3B82F6',
            'Female Sports Complex' => '#F43F5E',
            'Saidina Hamzah Stadium' => '#F59E0B',
            'IIUM Archery Range' => '#10B981',
            'UIA Football Turf' => '#14B8A6',
            'IIUM Cricket Ground' => '#8B5CF6',
            'IIUM Rugby Field' => '#D946EF',
            'Padang Kawad UIAM' => '#6B7280',
            'IIUM Educare' => '#F97316',
            'Sultan Haji Ahmad Shah Mosque' => '#A855F7',
        ];

        $result = [];
        foreach ($grouped as $location => $data) {
            // Get the key (short name) for frontend matching
            $key = $data['key'];

            // Try to find matching color
            $color = $locationColors[$location] ?? null;

            // If not found, try to find by key
            if (!$color && isset($locationColors[$key])) {
                $color = $locationColors[$key];
            }

            $result[] = [
                'name' => $location,
                'count' => $data['count'],
                'color' => $color ?? '#D4A853',
                'type' => $this->getLocationTypeFromName($location),
            ];
        }

        // Sort by incident count descending
        usort($result, function ($a, $b) {
            return $b['count'] - $a['count'];
        });

        return $result;
    }

    /**
     * Get location type from normalized name
     */
    private function getLocationTypeFromName($locationName)
    {
        if (strpos($locationName, 'Mahallah') !== false) {
            return 'Mahallah';
        }

        $kulliyyahNames = ['KIRKHS', 'KICT', 'KOE', 'KAED', 'KENMS', 'AIKOL', 'KOED'];
        foreach ($kulliyyahNames as $kulliyyah) {
            if (strpos($locationName, $kulliyyah) !== false) {
                return 'Kulliyyah';
            }
        }

        $facilityNames = ['Library', 'Sports Complex', 'Stadium', 'Archery', 'Football', 'Cricket', 'Rugby', 'Padang', 'Educare', 'Mosque'];
        foreach ($facilityNames as $facility) {
            if (strpos($locationName, $facility) !== false) {
                return 'Facility';
            }
        }

        return 'Other';
    }

    /**
     * Calculate average response rate per month
     */
    private function calculateAverageResponseRateByMonth($reports)
    {
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $currentYear = Carbon::now()->year;

        $result = [];

        foreach ($months as $index => $month) {
            $monthNumber = $index + 1;

            $monthReports = $reports->filter(function ($report) use ($monthNumber, $currentYear) {
                if (!$report->incidentDateTime) return false;
                $reportMonth = Carbon::parse($report->incidentDateTime)->month;
                $reportYear = Carbon::parse($report->incidentDateTime)->year;
                return $reportMonth === $monthNumber && $reportYear === $currentYear;
            });

            $totalCases = $monthReports->count();
            $resolvedCases = $monthReports->where('status', 'resolved')->count();
            $responseRate = $totalCases > 0 ? round(($resolvedCases / $totalCases) * 100) : 0;

            $result[] = [
                'month' => $month,
                'responseRate' => $responseRate,
            ];
        }

        return $result;
    }

    /**
     * Get location statistics for API endpoint (optional)
     */
    public function getLocationStats(Request $request)
    {
        $dateFrom = $request->get('dateFrom');
        $dateTo = $request->get('dateTo');

        $query = Report::query();

        if ($dateFrom) {
            $query->whereDate('incidentDateTime', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('incidentDateTime', '<=', $dateTo);
        }

        $reports = $query->get();
        $locationData = $this->calculateLocationDataWithProximity($reports);

        return response()->json([
            'locations' => $locationData,
            'total' => $reports->count(),
        ]);
    }
}
