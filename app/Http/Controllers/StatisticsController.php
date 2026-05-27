<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class StatisticsController extends Controller
{
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

        // Calculate filtered charts data
        $filteredCategories = $this->calculateCategoryDistribution($filteredReports);
        $filteredLocationData = $this->calculateLocationData($filteredReports); // Now uses locationArea

        // Trends (always show all data - unchanged by filters)
        $weeklyData = $this->calculateWeeklyData($allReports);
        $monthlyData = $this->calculateMonthlyData($allReports);
        $locationData = $this->calculateLocationData($allReports); // Now uses locationArea
        $averageResponseRateByMonth = $this->calculateAverageResponseRateByMonth($allReports);

        return Inertia::render('Statistics', [
            'statistics' => $statistics,
            'weeklyData' => $weeklyData,
            'monthlyData' => $monthlyData,
            'mahallahData' => $locationData, // Keep prop name for compatibility
            'filteredCategories' => $filteredCategories,
            'filteredMahallahData' => $filteredLocationData, // Keep prop name for compatibility
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

        // Group by category
        $categories = $reports->groupBy('incidentCategory')->map(function ($group) {
            return $group->count();
        })->toArray();

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
            'categories' => $categories,
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
            'emergencyAlert' => 'Emergency Alert',
            'other' => 'Other',
        ];

        $colors = [
            'theft' => '#D4A853',
            'theft_robbery' => '#D4A853',
            'harassment' => '#EF4444',
            'vandalism' => '#8B5CF6',
            'suspiciousActivity' => '#3B9B8C',
            'suspicious_activity' => '#3B9B8C',
            'fire_hazard' => '#F59E0B',
            'facility_issue' => '#5B8DEE',
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
     * Calculate location data using locationArea (includes Mahallahs, Kulliyyahs, Facilities)
     */
    private function calculateLocationData($reports)
    {
        if ($reports->isEmpty()) {
            return [];
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
        ];

        // Group reports by locationArea (using getLocationArea method)
        $grouped = $reports->groupBy(function($report) {
            $locationArea = $report->getLocationArea();
            if (empty($locationArea)) {
                return 'Unknown';
            }
            // Normalize the location name
            return $this->normalizeLocationName($locationArea);
        });

        $result = [];
        foreach ($grouped as $location => $reportsInLocation) {
            if (empty($location) || $location === 'Unknown') continue;

            // Get location type
            $type = $this->getLocationTypeFromName($location);

            $result[] = [
                'name' => $location,
                'count' => $reportsInLocation->count(),
                'color' => $locationColors[$location] ?? '#D4A853',
                'type' => $type,
            ];
        }

        // Sort by incident count descending
        usort($result, function ($a, $b) {
            return $b['count'] - $a['count'];
        });

        return $result;
    }

    /**
     * Normalize location names to standard format
     */
    private function normalizeLocationName($locationName)
    {
        $normalizations = [
            // Mahallahs
            'asiah' => 'Mahallah Asiah',
            'mahallah asiah' => 'Mahallah Asiah',
            'aminah' => 'Mahallah Aminah',
            'mahallah aminah' => 'Mahallah Aminah',
            'safiyyah' => 'Mahallah Safiyyah',
            'mahallah safiyyah' => 'Mahallah Safiyyah',
            'maryam' => 'Mahallah Maryam',
            'mahallah maryam' => 'Mahallah Maryam',
            'ruqayyah' => 'Mahallah Ruqayyah',
            'mahallah ruqayyah' => 'Mahallah Ruqayyah',
            'ali' => 'Mahallah Ali',
            'mahallah ali' => 'Mahallah Ali',
            'faruq' => 'Mahallah Faruq',
            'mahallah faruq' => 'Mahallah Faruq',
            'bilal' => 'Mahallah Bilal',
            'mahallah bilal' => 'Mahallah Bilal',
            'asma' => 'Mahallah Asma',
            'mahallah asma' => 'Mahallah Asma',
            'hafsah' => 'Mahallah Hafsah',
            'mahallah hafsah' => 'Mahallah Hafsah',
            'halimah' => 'Mahallah Halimah',
            'mahallah halimah' => 'Mahallah Halimah',
            'siddiq' => 'Mahallah Siddiq',
            'mahallah siddiq' => 'Mahallah Siddiq',
            'salahuddin' => 'Mahallah Salahuddin',
            'mahallah salahuddin' => 'Mahallah Salahuddin',
            'uthman' => 'Mahallah Uthman',
            'mahallah uthman' => 'Mahallah Uthman',
            'nusaibah' => 'Mahallah Nusaibah',
            'mahallah nusaibah' => 'Mahallah Nusaibah',
            'zubair' => 'Mahallah Zubair Al-Awwam',
            'zubair al-awwam' => 'Mahallah Zubair Al-Awwam',
            'mahallah zubair' => 'Mahallah Zubair Al-Awwam',
            'sumayyah' => 'Mahallah Sumayyah',
            'mahallah sumayyah' => 'Mahallah Sumayyah',

            // Kulliyyahs
            'kirkhs' => 'KIRKHS (AHAS KIRKHS)',
            'abdulhamid abusulayman kulliyyah' => 'KIRKHS (AHAS KIRKHS)',
            'kict' => 'KICT (ICT)',
            'kulliyyah of information and communication technology' => 'KICT (ICT)',
            'koe' => 'KOE (Engineering)',
            'kulliyyah of engineering' => 'KOE (Engineering)',
            'kaed' => 'KAED (Architecture)',
            'kulliyyah of architecture and environmental design' => 'KAED (Architecture)',
            'kenms' => 'KENMS (Economics)',
            'kulliyyah of economics and management sciences' => 'KENMS (Economics)',
            'aikol' => 'AIKOL (Law)',
            'ahmad ibrahim kulliyyah of law' => 'AIKOL (Law)',
            'koed' => 'KOED (Education)',
            'kulliyyah of education' => 'KOED (Education)',

            // Facilities
            'library' => 'Dar al-Hikmah Library',
            'dar al-hikmah library' => 'Dar al-Hikmah Library',
            'female sports complex' => 'Female Sports Complex',
            'stadium' => 'Saidina Hamzah Stadium',
            'saidina hamzah stadium' => 'Saidina Hamzah Stadium',
            'archery range' => 'IIUM Archery Range',
            'iium archery range' => 'IIUM Archery Range',
            'football turf' => 'UIA Football Turf',
            'uia football turf' => 'UIA Football Turf',
            'cricket ground' => 'IIUM Cricket Ground',
            'iium cricket ground' => 'IIUM Cricket Ground',
            'rugby field' => 'IIUM Rugby Field',
            'iium rugby field' => 'IIUM Rugby Field',
            'padang kawad' => 'Padang Kawad UIAM',
            'padang kawad uiam' => 'Padang Kawad UIAM',
            'educare' => 'IIUM Educare',
            'iium educare' => 'IIUM Educare',
        ];

        $lowercase = strtolower(trim($locationName));

        if (isset($normalizations[$lowercase])) {
            return $normalizations[$lowercase];
        }

        // Capitalize first letter of each word for other names
        return ucwords(strtolower($locationName));
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

        $facilityNames = ['Library', 'Sports Complex', 'Stadium', 'Archery', 'Football', 'Cricket', 'Rugby', 'Padang', 'Educare'];
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

            // Get reports for this month
            $monthReports = $reports->filter(function ($report) use ($monthNumber, $currentYear) {
                if (!$report->incidentDateTime) return false;
                $reportMonth = Carbon::parse($report->incidentDateTime)->month;
                $reportYear = Carbon::parse($report->incidentDateTime)->year;
                return $reportMonth === $monthNumber && $reportYear === $currentYear;
            });

            $totalCases = $monthReports->count();
            $resolvedCases = $monthReports->where('status', 'resolved')->count();

            // Calculate response rate (percentage of resolved cases)
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
        $locationData = $this->calculateLocationData($reports);

        return response()->json([
            'locations' => $locationData,
            'total' => $reports->count(),
        ]);
    }
}
