<?php
// app/Http/Controllers/DashboardController.php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Student;
use App\Models\Officer;
use App\Models\Admins;
use App\Models\Emergencies;
use App\Models\UnregisteredReporter;
use App\Traits\LocationMatchingTrait; // ADD THIS
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    use LocationMatchingTrait; // ADD THIS

    public function __construct()
    {
        // Initialize location matching trait
        $this->initLocationMatching(); // ADD THIS
    }

    public function getRecentReports(Request $request)
    {
        try {
            // Get the 10 most recent reports
            $recentReports = Report::orderBy('reportedAt', 'desc')
                ->limit(10)
                ->get();

            // Transform reports for frontend
            $transformedReports = [];

            foreach ($recentReports as $report) {
                try {
                    // ============================================
                    // FIX: ADD DETERMINED LOCATION USING TRAIT
                    // ============================================
                    $determinedLocation = $this->determineReportLocation($report);
                    $specificAddress = $this->getOriginalLocationText($report);
                    $locationAreaFromReport = $this->getLocationAreaFromReport($report);

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

                    // Build the report object
                    $transformedReports[] = [
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

            Log::info('Dashboard recent reports fetched', [
                'count' => count($transformedReports),
                'first_report' => count($transformedReports) > 0 ? [
                    'reportId' => $transformedReports[0]['reportId'],
                    'determinedLocation' => $transformedReports[0]['determinedLocation'] ?? 'missing',
                    'specificAddress' => $transformedReports[0]['specificAddress'] ?? 'missing',
                ] : null
            ]);

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
