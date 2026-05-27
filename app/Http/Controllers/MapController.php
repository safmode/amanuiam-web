<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Inertia\Inertia;
use Illuminate\Http\Request;

class MapController extends Controller
{
    private $googleApiKey;

    // Define main locations with their keywords and radius
    private $mainLocations = [
        // Mahallahs
        'Mahallah Asiah' => ['keywords' => ['asiah', 'mahallah asiah', 'mahallah asiah'], 'radius' => 200],
        'Mahallah Aminah' => ['keywords' => ['aminah', 'mahallah aminah', 'mahallah aminah'], 'radius' => 200],
        'Mahallah Safiyyah' => ['keywords' => ['safiyyah', 'mahallah safiyyah'], 'radius' => 200],
        'Mahallah Maryam' => ['keywords' => ['maryam', 'mahallah maryam'], 'radius' => 200],
        'Mahallah Ruqayyah' => ['keywords' => ['ruqayyah', 'mahallah ruqayyah'], 'radius' => 200],
        'Mahallah Ali' => ['keywords' => ['ali', 'mahallah ali'], 'radius' => 200],
        'Mahallah Faruq' => ['keywords' => ['faruq', 'mahallah faruq'], 'radius' => 200],
        'Mahallah Bilal' => ['keywords' => ['bilal', 'mahallah bilal'], 'radius' => 200],
        'Mahallah Asma' => ['keywords' => ['asma', 'mahallah asma'], 'radius' => 200],
        'Mahallah Hafsah' => ['keywords' => ['hafsah', 'mahallah hafsah'], 'radius' => 200],
        'Mahallah Halimah' => ['keywords' => ['halimah', 'mahallah halimah'], 'radius' => 200],
        'Mahallah Siddiq' => ['keywords' => ['siddiq', 'mahallah siddiq'], 'radius' => 200],
        'Mahallah Salahuddin' => ['keywords' => ['salahuddin', 'mahallah salahuddin'], 'radius' => 200],
        'Mahallah Uthman' => ['keywords' => ['uthman', 'mahallah uthman'], 'radius' => 200],
        'Mahallah Nusaibah' => ['keywords' => ['nusaibah', 'mahallah nusaibah'], 'radius' => 200],
        'Mahallah Zubair Al-Awwam' => ['keywords' => ['zubair', 'mahallah zubair'], 'radius' => 200],
        'Mahallah Sumayyah' => ['keywords' => ['sumayyah', 'mahallah sumayyah'], 'radius' => 200],

        // Kulliyyahs - EXPANDED KEYWORDS
        'KIRKHS (AHAS KIRKHS)' => ['keywords' => ['kirkhs', 'kulliyyah of human sciences', 'ahmad ibrahim', 'human sciences', 'kulliyyah of islamic revealed knowledge'], 'radius' => 150],
        'KICT (ICT)' => ['keywords' => ['kict', 'ict', 'information technology', 'computer science', 'kulliyyah of information and communication technology', 'iibf', 'islamic banking', 'islamic banking & finance', 'iiibf'], 'radius' => 200],
        'KOE (Engineering)' => ['keywords' => ['koe', 'engineering', 'engineer', 'kulliyyah of engineering', 'kuliyah engineering'], 'radius' => 150],
        'KAED (Architecture)' => ['keywords' => ['kaed', 'architecture', 'design', 'architect', 'kulliyyah of architecture'], 'radius' => 150],
        'KENMS (Economics)' => ['keywords' => ['kenms', 'economics', 'management', 'business', 'kulliyyah of economics'], 'radius' => 150],
        'AIKOL (Law)' => ['keywords' => ['aikol', 'law', 'legal', 'kulliyyah of law'], 'radius' => 150],
        'KOED (Education)' => ['keywords' => ['koed', 'education', 'teaching', 'kulliyyah of education'], 'radius' => 150],

        // Facilities
        'Dar al-Hikmah Library' => ['keywords' => ['library', 'dar al-hikmah', 'perpustakaan'], 'radius' => 100],
        'Female Sports Complex' => ['keywords' => ['female sports', 'sports complex', 'gym', 'women sports'], 'radius' => 150],
        'Saidina Hamzah Stadium' => ['keywords' => ['stadium', 'saidina hamzah', 'field'], 'radius' => 200],
        'IIUM Archery Range' => ['keywords' => ['archery', 'panahan'], 'radius' => 100],
        'UIA Football Turf' => ['keywords' => ['football', 'soccer', 'turf'], 'radius' => 120],
        'IIUM Cricket Ground' => ['keywords' => ['cricket', 'ground'], 'radius' => 150],
        'IIUM Rugby Field' => ['keywords' => ['rugby', 'field'], 'radius' => 150],
        'Padang Kawad UIAM' => ['keywords' => ['padang kawad', 'parade', 'kawad'], 'radius' => 150],
        'IIUM Educare' => ['keywords' => ['educare', 'kindergarten', 'preschool', 'taska'], 'radius' => 100],
    ];

    // Pre-loaded coordinates from config (NO API CALLS!)
    private $mainLocationCoordinates = [];

    public function __construct()
    {
        $this->googleApiKey = env('GOOGLE_MAPS_API_KEY', '');

        // Load pre-saved coordinates from config file (one-time setup)
        if (file_exists(config_path('map_coordinates.php'))) {
            $this->mainLocationCoordinates = include(config_path('map_coordinates.php'));
            \Log::info('Loaded ' . count($this->mainLocationCoordinates) . ' coordinates from config file');
        } else {
            \Log::warning('Map coordinates config file not found. Run: php artisan map:seed-coordinates');
        }
    }

    public function index(Request $request)
    {
        // Get date filters from request
        $dateFrom = $request->get('dateFrom');
        $dateTo = $request->get('dateTo');
        $dateFilter = $request->get('dateFilter', 'all');

        \Log::info('Heatmap Request - Date From: ' . ($dateFrom ?? 'null'));
        \Log::info('Heatmap Request - Date To: ' . ($dateTo ?? 'null'));

        // Get filtered reports
        $filteredQuery = Report::query();

        if ($dateFrom) {
            $filteredQuery->whereDate('incidentDateTime', '>=', $dateFrom);
        }
        if ($dateTo) {
            $filteredQuery->whereDate('incidentDateTime', '<=', $dateTo);
        }

        $filteredReports = $filteredQuery->get();

        \Log::info('Heatmap - Filtered Reports Count: ' . $filteredReports->count());

        // Group reports by proximity to main locations
        $groupedByLocation = $this->groupReportsByProximity($filteredReports);

        // DEBUG: Log what was grouped
        \Log::info('Groups created: ' . json_encode(array_keys($groupedByLocation->toArray())));
        foreach ($groupedByLocation as $locationName => $reports) {
            \Log::info("{$locationName}: " . $reports->count() . " reports");
            foreach ($reports as $report) {
                \Log::debug("  - {$report->reportId}: {$report->incidentCategory}");
            }
        }

        $hotspots = [];
        $maxIncidents = $groupedByLocation->max(function ($group) {
            return $group->count();
        });

        foreach ($groupedByLocation as $locationName => $reportsInLocation) {
            if (empty($locationName) || $locationName === 'Unknown') continue;

            // Get coordinates for this main location (from pre-saved config)
            $coordinates = $this->mainLocationCoordinates[$locationName] ?? null;

            if (!$coordinates) {
                \Log::warning("No coordinates found for location: {$locationName}");
                continue;
            }

            $incidentCount = $reportsInLocation->count();
            $riskLevel = $this->calculateRiskLevel($incidentCount, $maxIncidents);

            // Get incident breakdown by category
            $breakdown = $reportsInLocation->groupBy('incidentCategory')->map(function ($group) {
                return $group->count();
            })->toArray();

            // Get top incident type
            $topIncident = !empty($breakdown) ? array_keys($breakdown, max($breakdown))[0] : 'No incidents';
            $topCount = !empty($breakdown) ? max($breakdown) : 0;

            $hotspots[] = [
                'id' => strtolower(str_replace([' ', '_', '-'], '_', $locationName)),
                'location' => $locationName,
                'lat' => $coordinates['lat'],
                'lng' => $coordinates['lng'],
                'incidents' => $incidentCount,
                'riskLevel' => $riskLevel,
                'breakdown' => $breakdown,
                'topIncident' => $this->formatCategoryName($topIncident),
                'topCount' => $topCount,
            ];
        }

        // Sort by incident count descending
        usort($hotspots, function ($a, $b) {
            return $b['incidents'] - $a['incidents'];
        });

        \Log::info('Generated ' . count($hotspots) . ' hotspots');

        return Inertia::render('Heatmap', [
            'hotspots' => array_values($hotspots),
            'currentDateFilter' => $dateFilter,
            'googleApiKey' => $this->googleApiKey,
        ]);
    }

    /**
     * Group reports by proximity to main locations
     * Uses 3 methods: Keyword matching, Coordinate proximity, and LocationArea fallback
     */
    private function groupReportsByProximity($reports)
    {
        $grouped = collect();
        $unassigned = [];

        foreach ($reports as $report) {
            $assigned = false;

            // METHOD 1: Try keyword matching using locationArea (BEST for reports without coordinates)
            $locationArea = $this->getLocationAreaFromReport($report);
            if (!empty($locationArea)) {
                $matchedLocation = $this->matchLocationToMainLocation($locationArea);
                if ($matchedLocation) {
                    if (!isset($grouped[$matchedLocation])) {
                        $grouped[$matchedLocation] = collect();
                    }
                    $grouped[$matchedLocation]->push($report);
                    \Log::debug("Assigned report {$report->reportId} to {$matchedLocation} by keyword matching (locationArea: {$locationArea})");
                    $assigned = true;
                }
            }

            // METHOD 2: Try proximity matching using actual coordinates (most accurate)
            if (!$assigned) {
                $reportCoords = $this->getReportCoordinates($report);
                if ($reportCoords && !empty($this->mainLocationCoordinates)) {
                    $assigned = $this->assignByProximity($report, $reportCoords, $grouped);
                }
            }

            // METHOD 3: Try matching by description/address for reports without locationArea
            if (!$assigned) {
                $description = $report->description ?? '';
                $address = $this->getAddressFromReport($report);
                $searchText = strtolower($description . ' ' . $address);

                foreach ($this->mainLocations as $locationName => $config) {
                    foreach ($config['keywords'] as $keyword) {
                        if (strpos($searchText, strtolower($keyword)) !== false) {
                            if (!isset($grouped[$locationName])) {
                                $grouped[$locationName] = collect();
                            }
                            $grouped[$locationName]->push($report);
                            \Log::info("Assigned report {$report->reportId} to {$locationName} by description/address matching");
                            $assigned = true;
                            break 2;
                        }
                    }
                }
            }

            // If still not assigned, add to unassigned
            if (!$assigned) {
                $unassigned[] = $report;
                \Log::warning("Report {$report->reportId} could not be assigned to any location. LocationArea: " . ($locationArea ?? 'null'));
            }
        }

        // Handle unassigned reports (Unknown location)
        if (!empty($unassigned)) {
            $grouped['Unknown'] = collect($unassigned);
            \Log::info('Unassigned reports count: ' . count($unassigned));
        }

        return $grouped;
    }

    /**
     * Get locationArea from report
     */
    private function getLocationAreaFromReport($report)
    {
        $location = $report->location;

        if (is_array($location)) {
            return $location['locationArea'] ?? '';
        }

        if (is_object($location) && isset($location->locationArea)) {
            return $location->locationArea;
        }

        if (isset($report->locationArea)) {
            return $report->locationArea;
        }

        return '';
    }

    /**
     * Get address from report
     */
    private function getAddressFromReport($report)
    {
        $location = $report->location;

        if (is_array($location)) {
            return $location['address'] ?? '';
        }

        if (is_object($location) && isset($location->address)) {
            return $location->address;
        }

        return '';
    }

    /**
     * Get coordinates directly from report (if available)
     */
    private function getReportCoordinates($report)
    {
        $location = $report->location;

        if (is_array($location)) {
            // Check for latitude/longitude in the location array
            if (isset($location['latitude']) && isset($location['longitude'])
                && is_numeric($location['latitude']) && is_numeric($location['longitude'])
                && $location['latitude'] != 0 && $location['longitude'] != 0) {
                return ['lat' => (float)$location['latitude'], 'lng' => (float)$location['longitude']];
            }

            // Check for lat/lng in the location array
            if (isset($location['lat']) && isset($location['lng'])
                && is_numeric($location['lat']) && is_numeric($location['lng'])
                && $location['lat'] != 0 && $location['lng'] != 0) {
                return ['lat' => (float)$location['lat'], 'lng' => (float)$location['lng']];
            }
        }

        // Check if report has direct lat/lng properties
        if (isset($report->latitude) && isset($report->longitude)
            && is_numeric($report->latitude) && is_numeric($report->longitude)
            && $report->latitude != 0 && $report->longitude != 0) {
            return ['lat' => (float)$report->latitude, 'lng' => (float)$report->longitude];
        }

        return null;
    }

    /**
     * Match locationArea to main location using keywords
     */
    private function matchLocationToMainLocation($locationArea)
    {
        if (empty($locationArea)) return null;

        $locationAreaLower = strtolower($locationArea);

        foreach ($this->mainLocations as $mainLocationName => $config) {
            foreach ($config['keywords'] as $keyword) {
                if (strpos($locationAreaLower, strtolower($keyword)) !== false) {
                    return $mainLocationName;
                }
            }
        }

        return null;
    }

    /**
     * Calculate distance between two points in meters (Haversine formula)
     */
    private function calculateDistance($lat1, $lng1, $lat2, $lng2)
    {
        $earthRadius = 6371000; // meters

        $latDelta = deg2rad($lat2 - $lat1);
        $lngDelta = deg2rad($lng2 - $lng1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lngDelta / 2) * sin($lngDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Assign report by proximity to nearest main location
     * This handles cases like "IIiBF near KICT" - it will find the closest location
     */
    private function assignByProximity($report, $reportCoords, &$grouped)
    {
        $bestMatch = null;
        $bestDistance = PHP_FLOAT_MAX;

        foreach ($this->mainLocationCoordinates as $locationName => $locationCoords) {
            $radius = $this->mainLocations[$locationName]['radius'] ?? 200;

            $distance = $this->calculateDistance(
                $reportCoords['lat'], $reportCoords['lng'],
                $locationCoords['lat'], $locationCoords['lng']
            );

            // If within radius, consider it a match
            if ($distance <= $radius && $distance < $bestDistance) {
                $bestDistance = $distance;
                $bestMatch = $locationName;
            }
        }

        if ($bestMatch) {
            if (!isset($grouped[$bestMatch])) {
                $grouped[$bestMatch] = collect();
            }
            $grouped[$bestMatch]->push($report);
            \Log::info("Assigned report {$report->reportId} to {$bestMatch} by proximity (distance: {$bestDistance}m, coords: {$reportCoords['lat']}, {$reportCoords['lng']})");
            return true;
        }

        return false;
    }

    private function calculateRiskLevel($incidentCount, $maxIncidents)
    {
        if ($maxIncidents == 0) return 'low';
        $percentage = ($incidentCount / $maxIncidents) * 100;
        if ($percentage >= 70) return 'high';
        if ($percentage >= 40) return 'moderate';
        return 'low';
    }

    private function formatCategoryName($category)
    {
        $labels = [
            'theft' => 'Theft/Robbery',
            'theft_robbery' => 'Theft/Robbery',
            'harassment' => 'Harassment',
            'vandalism' => 'Vandalism',
            'fire_hazard' => 'Fire Hazard',
            'suspiciousActivity' => 'Suspicious Activity',
            'suspicious_activity' => 'Suspicious Activity',
            'facility_issue' => 'Facility Issue',
            'wildAnimal' => 'Wild Animal',
            'wild_animal' => 'Wild Animal',
            'trespassing' => 'Trespassing',
            'other' => 'Other',
        ];
        return $labels[$category] ?? ucfirst(str_replace('_', ' ', $category));
    }

    /**
     * Get heatmap data as JSON
     */
    public function getHeatmapData(Request $request)
    {
        $dateFrom = $request->get('dateFrom');
        $dateTo = $request->get('dateTo');

        $filteredQuery = Report::query();

        if ($dateFrom) {
            $filteredQuery->whereDate('incidentDateTime', '>=', $dateFrom);
        }
        if ($dateTo) {
            $filteredQuery->whereDate('incidentDateTime', '<=', $dateTo);
        }

        $filteredReports = $filteredQuery->get();
        $groupedByLocation = $this->groupReportsByProximity($filteredReports);

        $hotspots = [];
        $maxIncidents = $groupedByLocation->max(function ($group) {
            return $group->count();
        });

        foreach ($groupedByLocation as $locationName => $reportsInLocation) {
            if (empty($locationName) || $locationName === 'Unknown') continue;

            $coordinates = $this->mainLocationCoordinates[$locationName] ?? null;

            if (!$coordinates) {
                continue;
            }

            $incidentCount = $reportsInLocation->count();
            $riskLevel = $this->calculateRiskLevel($incidentCount, $maxIncidents);

            $breakdown = $reportsInLocation->groupBy('incidentCategory')->map(function ($group) {
                return $group->count();
            })->toArray();

            $hotspots[] = [
                'id' => strtolower(str_replace([' ', '_', '-'], '_', $locationName)),
                'location' => $locationName,
                'lat' => $coordinates['lat'],
                'lng' => $coordinates['lng'],
                'incidents' => $incidentCount,
                'riskLevel' => $riskLevel,
                'breakdown' => $breakdown,
                'topIncident' => $this->formatCategoryName(array_key_first($breakdown) ?? 'No incidents'),
                'topCount' => !empty($breakdown) ? max($breakdown) : 0,
            ];
        }

        usort($hotspots, function ($a, $b) {
            return $b['incidents'] - $a['incidents'];
        });

        return response()->json([
            'hotspots' => array_values($hotspots),
            'total' => $filteredReports->count(),
            'lastUpdated' => now()->toDateTimeString(),
        ]);
    }
}
