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
            // Get the 10 most recent reports
            $recentReports = Report::orderBy('reportedAt', 'desc')
                ->limit(10)
                ->get();

            // DEBUG: Check coordinates file
            Log::info('=== DASHBOARD DEBUG ===');
            Log::info('map_coordinates.php exists: ' . (file_exists(config_path('map_coordinates.php')) ? 'YES' : 'NO'));
            Log::info('mainLocationCoordinates count: ' . count($this->mainLocationCoordinates));
            Log::info('mainLocationCoordinates keys: ' . implode(', ', array_keys($this->mainLocationCoordinates)));

            $transformedReports = [];

            foreach ($recentReports as $report) {
                try {
                    // DEBUG: Log the report
                    Log::info('Processing report: ' . ($report->reportId ?? 'unknown'), [
                        'location' => $report->location,
                        'mahallah' => $report->mahallah ?? 'null',
                    ]);

                    // ============================================
                    // GET DETERMINED LOCATION WITH FALLBACKS
                    // ============================================
                    $determinedLocation = $this->determineReportLocation($report);

                    // FALLBACK 1: If determinedLocation is null, try to extract from location data
                    if (empty($determinedLocation) || $determinedLocation === 'Unknown') {
                        Log::warning('determineReportLocation returned null/unknown for report ' . ($report->reportId ?? 'unknown') . ', trying fallbacks');

                        // Check if location has locationArea
                        if (isset($report->location) && is_array($report->location) && isset($report->location['locationArea'])) {
                            $locationArea = $report->location['locationArea'];
                            foreach ($this->mainLocations as $locationName => $config) {
                                if (strtolower($config['display']) === strtolower($locationArea) ||
                                    strtolower($config['key']) === strtolower($locationArea) ||
                                    strpos(strtolower($locationArea), strtolower($config['key'])) !== false) {
                                    $determinedLocation = $config['key'];
                                    Log::info('Found location from locationArea: ' . $determinedLocation);
                                    break;
                                }
                            }
                        }
                    }

                    // FALLBACK 2: Check mahallah
                    if (empty($determinedLocation) && !empty($report->mahallah) && $report->mahallah !== 'Unknown Location') {
                        foreach ($this->mainLocations as $locationName => $config) {
                            if (strpos(strtolower($report->mahallah), strtolower($config['key'])) !== false) {
                                $determinedLocation = $config['key'];
                                Log::info('Found location from mahallah: ' . $determinedLocation);
                                break;
                            }
                        }
                    }

                    // FALLBACK 3: Hardcoded coordinates for KICT
                    if (empty($determinedLocation)) {
                        $coords = $this->getReportCoordinates($report);
                        if ($coords) {
                            // KICT coordinates (approximate)
                            $kictLat = 3.2537;
                            $kictLng = 101.7302;
                            $distance = $this->calculateDistance($coords['lat'], $coords['lng'], $kictLat, $kictLng);
                            if ($distance < 500) { // Within 500 meters
                                $determinedLocation = 'KICT';
                                Log::info('Report ' . ($report->reportId ?? 'unknown') . ' matched KICT by hardcoded coordinates (distance: ' . round($distance, 2) . 'm)');
                            }
                        }
                    }

                    // FINAL FALLBACK: Use 'Unknown'
                    if (empty($determinedLocation)) {
                        $determinedLocation = 'Unknown';
                        Log::warning('Report ' . ($report->reportId ?? 'unknown') . ' using Unknown as final fallback');
                    }

                    $specificAddress = $this->getOriginalLocationText($report);
                    $locationAreaFromReport = $this->getLocationAreaFromReport($report);

                    // DEBUG: Log the determined location
                    Log::info('Final determined location for report ' . ($report->reportId ?? 'unknown'), [
                        'determinedLocation' => $determinedLocation,
                        'specificAddress' => $specificAddress,
                        'locationAreaFromReport' => $locationAreaFromReport,
                    ]);

                    // Get reporter info
                    $studentName = 'Unknown Reporter';
                    $studentEmail = null;
                    $studentPhone = null;
                    $studentMatrix = null;
                    $reporterTypeDisplay = 'Reporter';

                    // Simple reporter lookup
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

                    // Also check for unregistered reporters
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

                    // Get location data safely
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

                    // Fallback to mahallah if no locationArea
                    if (!$locationArea && isset($report->mahallah)) {
                        $locationArea = $report->mahallah;
                    }

                    // Get officer name
                    $officerName = 'Not Assigned';
                    if (isset($report->assignedOfficer) && $report->assignedOfficer) {
                        $officer = Officer::where('officerId', $report->assignedOfficer)->first();
                        if ($officer) {
                            $officerName = $officer->officerName ?? 'Not Assigned';
                        }
                    }

                    // Build the report object - MAKE SURE determinedLocation is included
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

                        // Reporter info
                        'studentName' => $studentName,
                        'studentEmail' => $studentEmail,
                        'studentPhone' => $studentPhone,
                        'studentMatrix' => $studentMatrix,
                        'reporter_type_display' => $reporterTypeDisplay,
                        'reporter_type' => $report->reporter_type ?? 'unregistered',

                        // ============================================
                        // LOCATION INFO - USING DETERMINED LOCATION
                        // ============================================
                        'determinedLocation' => $determinedLocation, // CRITICAL FIX
                        'specificAddress' => $specificAddress, // CRITICAL FIX
                        'locationArea' => $locationAreaFromReport ?: $locationArea,
                        'building' => $building,
                        'address' => $address,
                        'specificPlace' => $specificPlace,
                        'locationRaw' => $locationRaw,
                        'mahallah' => $report->mahallah ?? null,

                        // Officer info
                        'assignedOfficer' => $report->assignedOfficer ?? null,
                        'officerName' => $officerName,
                    ];

                    // DEBUG: Log the final transformed report
                    Log::info('Transformed report for ' . ($report->reportId ?? 'unknown'), [
                        'determinedLocation_in_response' => $transformedReport['determinedLocation'] ?? 'MISSING',
                        'specificAddress_in_response' => $transformedReport['specificAddress'] ?? 'MISSING',
                        'locationArea_in_response' => $transformedReport['locationArea'] ?? 'MISSING',
                    ]);

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

            $activeEmergencies = Emergencies::where('status', 'active')->count();
            $respondingEmergencies = Emergencies::where('status', 'responding')->count();
            $emergencyAlerts = $activeEmergencies + $respondingEmergencies;

            $stats = [
                'totalReports' => array_sum($statusCounts),
                'pendingReports' => $statusCounts['pending'],
                'inProgressReports' => $statusCounts['inProgress'],
                'resolvedReports' => $statusCounts['resolved'],
                'nfaReports' => $statusCounts['nfa'],
                'emergencyAlerts' => $emergencyAlerts,
            ];

            // DEBUG: Log the first few reports being sent to frontend
            if (count($transformedReports) > 0) {
                Log::info('First report being sent to frontend:', [
                    'reportId' => $transformedReports[0]['reportId'],
                    'determinedLocation' => $transformedReports[0]['determinedLocation'] ?? 'MISSING',
                    'specificAddress' => $transformedReports[0]['specificAddress'] ?? 'MISSING',
                ]);
            }

            Log::info('=== DASHBOARD DEBUG END ===');

            return response()->json([
                'success' => true,
                'recentReports' => $transformedReports,
                'stats' => $stats,
                'statusCounts' => $statusCounts,
                'lastUpdated' => now()->toDateTimeString(),
            ]);

        } catch (\Exception $e) {
            Log::error('DashboardController error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());

            // Return empty data instead of crashing
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
                'statusCounts' => [
                    'pending' => 0,
                    'inProgress' => 0,
                    'resolved' => 0,
                    'nfa' => 0,
                ],
                'lastUpdated' => now()->toDateTimeString(),
                'error' => $e->getMessage()
            ]);
        }
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
