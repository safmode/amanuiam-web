<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Traits\LocationMatchingTrait;
use Inertia\Inertia;
use Illuminate\Http\Request;

class MapController extends Controller
{
    use LocationMatchingTrait;

    private $googleApiKey;

    public function __construct()
    {
        $this->googleApiKey = env('GOOGLE_MAPS_API_KEY', '');

        // Initialize the trait
        $this->initLocationMatching();
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
     * Assign report by proximity to nearest main location
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
