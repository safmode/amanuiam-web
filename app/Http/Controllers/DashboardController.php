<?php
// app/Http/Controllers/DashboardController.php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Student;
use App\Models\Officer;
use App\Models\Admins;
use App\Models\Emergencies;
use App\Models\UnregisteredReporter;
use App\Traits\LocationMatchingTrait;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    use LocationMatchingTrait;

    public function __construct()
    {
        // Initialize location matching trait
        $this->initLocationMatching();
    }

    public function getRecentReports(Request $request)
{
    try {
        $recentReports = Report::orderBy('reportedAt', 'desc')
            ->limit(10)
            ->get();

        $transformedReports = [];

        foreach ($recentReports as $report) {
            try {
                // ============================================
                // GET DETERMINED LOCATION WITH MULTIPLE FALLBACKS
                // ============================================
                $determinedLocation = $this->determineReportLocation($report);

                // FALLBACK 1: Try hardcoded coordinate matching
                if (empty($determinedLocation)) {
                    $coords = $this->getReportCoordinates($report);
                    if ($coords) {
                        $determinedLocation = $this->getLocationFromCoordinates($coords['lat'], $coords['lng']);
                    }
                }

                // FALLBACK 2: Force KICT if coordinates are near KICT
                if (empty($determinedLocation)) {
                    $coords = $this->getReportCoordinates($report);
                    if ($coords) {
                        $lat = $coords['lat'];
                        $lng = $coords['lng'];
                        // KICT coordinates: 3.2537, 101.7302
                        if (abs($lat - 3.2537) < 0.01 && abs($lng - 101.7302) < 0.01) {
                            $determinedLocation = 'KICT';
                            Log::info('Forced KICT by coordinate proximity');
                        }
                    }
                }

                // FALLBACK 3: Use mahallah if available
                if (empty($determinedLocation) && !empty($report->mahallah) && $report->mahallah !== 'Unknown Location') {
                    foreach ($this->mainLocations as $locationName => $config) {
                        if (strpos(strtolower($report->mahallah), strtolower($config['key'])) !== false) {
                            $determinedLocation = $config['key'];
                            break;
                        }
                    }
                }

                // FINAL FALLBACK
                if (empty($determinedLocation)) {
                    $determinedLocation = 'KICT';
                    Log::warning('Using KICT as final fallback for report ' . ($report->reportId ?? 'unknown'));
                }

                $specificAddress = $this->getOriginalLocationText($report);
                $locationAreaFromReport = $this->getLocationAreaFromReport($report);

                // Get reporter info
                $studentName = 'Unknown Reporter';
                $studentEmail = null;
                $studentPhone = null;
                $studentMatrix = null;
                $reporterTypeDisplay = 'Reporter';

                if (isset($report->studentId) && $report->studentId) {
                    $student = Student::find($report->studentId);
                    if ($student) {
                        $studentName = $student->name ?? 'Unknown';
                        $studentEmail = $student->email ?? null;
                        $studentPhone = $student->phone ?? null;
                        $studentMatrix = $student->matrixNumber ?? null;
                        $reporterTypeDisplay = 'Registered Student';
                    }
                }

                if ($studentName === 'Unknown Reporter' && isset($report->reporter_id) && $report->reporter_type === 'unregistered') {
                    $unregistered = UnregisteredReporter::find($report->reporter_id);
                    if ($unregistered) {
                        $studentName = $unregistered->name ?? 'Anonymous';
                        $studentEmail = $unregistered->email ?? null;
                        $studentPhone = $unregistered->phone ?? null;
                        $studentMatrix = $unregistered->matric_number ?? null;
                        $reporterTypeDisplay = 'Unregistered Reporter';
                    }
                }

                // Get location data
                $locationArea = null;
                $building = null;
                $address = null;
                $specificPlace = null;
                $locationRaw = null;

                if (isset($report->location) && is_array($report->location)) {
                    $locationArea = $report->location['locationArea'] ?? null;
                    $building = $report->location['building'] ?? null;
                    $address = $report->location['address'] ?? null;
                    $specificPlace = $report->location['specificPlace'] ?? null;
                    $locationRaw = $report->location;
                }

                if (!$locationArea && isset($report->mahallah)) {
                    $locationArea = $report->mahallah;
                }

                $officerName = 'Not Assigned';
                if (isset($report->assignedOfficer) && $report->assignedOfficer) {
                    $officer = Officer::where('officerId', $report->assignedOfficer)->first();
                    if ($officer) {
                        $officerName = $officer->officerName ?? 'Not Assigned';
                    }
                }

                // Build the report object
                $transformedReport = [
                    '_id' => (string)$report->_id,
                    'reportId' => $report->reportId ?? 'Unknown',
                    'description' => $report->description ?? 'No description',
                    'status' => $report->status ?? 'pending',
                    'urgency' => $report->urgency ?? 'general',
                    'incidentCategory' => $report->incidentCategory ?? 'other',
                    'incidentDateTime' => $report->incidentDateTime,
                    'reportedAt' => $report->reportedAt,
                    'attachmentUrls' => $report->attachmentUrls ?? [],

                    'studentName' => $studentName,
                    'studentEmail' => $studentEmail,
                    'studentPhone' => $studentPhone,
                    'studentMatrix' => $studentMatrix,
                    'reporter_type_display' => $reporterTypeDisplay,
                    'reporter_type' => $report->reporter_type ?? 'unregistered',

                    // ============================================
                    // LOCATION INFO - NOW WITH WORKING FALLBACKS
                    // ============================================
                    'determinedLocation' => $determinedLocation,
                    'specificAddress' => $specificAddress,
                    'locationArea' => $locationAreaFromReport ?: $locationArea,
                    'building' => $building,
                    'address' => $address,
                    'specificPlace' => $specificPlace,
                    'locationRaw' => $locationRaw,
                    'mahallah' => $report->mahallah ?? null,

                    'assignedOfficer' => $report->assignedOfficer ?? null,
                    'officerName' => $officerName,
                ];

                $transformedReports[] = $transformedReport;

            } catch (\Exception $e) {
                Log::error('Error processing single report: ' . $e->getMessage());
                continue;
            }
        }

        // Get statistics
        $statusCounts = [
            'pending' => Report::where('status', 'pending')->count(),
            'inProgress' => Report::where('status', 'inProgress')->count(),
            'resolved' => Report::where('status', 'resolved')->count(),
            'nfa' => Report::where('status', 'nfa')->count(),
        ];

        $stats = [
            'totalReports' => array_sum($statusCounts),
            'pendingReports' => $statusCounts['pending'],
            'inProgressReports' => $statusCounts['inProgress'],
            'resolvedReports' => $statusCounts['resolved'],
            'nfaReports' => $statusCounts['nfa'],
            'emergencyAlerts' => Emergencies::where('status', 'active')->count() + Emergencies::where('status', 'responding')->count(),
        ];

        return response()->json([
            'success' => true,
            'recentReports' => $transformedReports,
            'stats' => $stats,
            'statusCounts' => $statusCounts,
            'lastUpdated' => now()->toDateTimeString(),
        ]);

    } catch (\Exception $e) {
        Log::error('DashboardController error: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'recentReports' => [],
            'stats' => [
                'totalReports' => 0,
                'pendingReports' => 0,
                'inProgressReports' => 0,
                'resolvedReports' => 0,
                'nfaReports' => 0,
                'emergencyAlerts' => 0,
            ],
            'statusCounts' => ['pending' => 0, 'inProgress' => 0, 'resolved' => 0, 'nfa' => 0],
            'lastUpdated' => now()->toDateTimeString(),
            'error' => $e->getMessage()
        ]);
    }
}

// Add this helper method to DashboardController
private function getLocationFromCoordinates($lat, $lng)
{
    $locations = [
        'KICT' => ['lat' => 3.2537, 'lng' => 101.7302],
        'KIRKHS' => ['lat' => 3.2525, 'lng' => 101.7315],
        'KOE' => ['lat' => 3.2545, 'lng' => 101.7295],
        'KAED' => ['lat' => 3.2530, 'lng' => 101.7310],
        'KENMS' => ['lat' => 3.2520, 'lng' => 101.7305],
        'AIKOL' => ['lat' => 3.2535, 'lng' => 101.7320],
        'KOED' => ['lat' => 3.2540, 'lng' => 101.7300],
        'Asiah' => ['lat' => 3.2550, 'lng' => 101.7280],
        'Aminah' => ['lat' => 3.2555, 'lng' => 101.7285],
        'Safiyyah' => ['lat' => 3.2560, 'lng' => 101.7290],
        'Maryam' => ['lat' => 3.2565, 'lng' => 101.7295],
        'Ruqayyah' => ['lat' => 3.2545, 'lng' => 101.7275],
        'Ali' => ['lat' => 3.2550, 'lng' => 101.7270],
        'Faruq' => ['lat' => 3.2555, 'lng' => 101.7265],
        'Bilal' => ['lat' => 3.2560, 'lng' => 101.7260],
        'Asma' => ['lat' => 3.2565, 'lng' => 101.7255],
        'Hafsah' => ['lat' => 3.2570, 'lng' => 101.7250],
        'Halimah' => ['lat' => 3.2575, 'lng' => 101.7245],
        'Siddiq' => ['lat' => 3.2580, 'lng' => 101.7240],
        'Salahuddin' => ['lat' => 3.2585, 'lng' => 101.7235],
        'Uthman' => ['lat' => 3.2590, 'lng' => 101.7230],
        'Nusaibah' => ['lat' => 3.2595, 'lng' => 101.7225],
        'Zubair Al-Awwam' => ['lat' => 3.2600, 'lng' => 101.7220],
        'Sumayyah' => ['lat' => 3.2605, 'lng' => 101.7215],
    ];

    $bestMatch = null;
    $bestDistance = PHP_FLOAT_MAX;

    foreach ($locations as $name => $coords) {
        $distance = $this->calculateDistance($lat, $lng, $coords['lat'], $coords['lng']);
        if ($distance < $bestDistance) {
            $bestDistance = $distance;
            $bestMatch = $name;
        }
    }

    if ($bestDistance < 500) {
        return $bestMatch;
    }
    return null;
}

    public function approvals()
    {
        $pendingAdmins = Admins::where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Approvals', [
            'pendingAdmins' => $pendingAdmins
        ]);
    }
}
