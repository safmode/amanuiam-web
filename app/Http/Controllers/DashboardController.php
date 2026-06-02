<?php
// app/Http/Controllers/DashboardController.php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Student;
use App\Models\Officer;
use App\Models\Admins;
use App\Models\Emergencies;
use App\Models\UnregisteredReporter;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function getRecentReports(Request $request)
    {
        // Get the 10 most recent reports
        $recentReports = Report::orderBy('reportedAt', 'desc')
            ->limit(10)
            ->get();

        // Get all officers for quick lookup
        $officers = Officer::all()->keyBy('officerId');

        // Collect IDs for registered students and unregistered reporters
        $studentIds = [];
        $unregisteredIds = [];
        $legacyMatricNumbers = [];

        foreach ($recentReports as $report) {
            if (isset($report->reporter_type)) {
                if ($report->reporter_type === 'registered' && $report->reporter_id) {
                    $studentIds[] = (string)$report->reporter_id;
                } elseif ($report->reporter_type === 'unregistered' && $report->reporter_id) {
                    $unregisteredIds[] = (string)$report->reporter_id;
                }
            }
            elseif (isset($report->studentId) && $report->studentId) {
                if (preg_match('/^[a-f0-9]{24}$/i', $report->studentId)) {
                    $studentIds[] = (string)$report->studentId;
                } else {
                    $legacyMatricNumbers[] = $report->studentId;
                }
            }
        }

        // Fetch registered students by ObjectId
        $students = collect();
        if (!empty($studentIds)) {
            $students = Student::whereIn('_id', $studentIds)->get()->keyBy(function($item) {
                return (string)$item->_id;
            });
        }

        // Fetch students by matric number for legacy reports
        $studentsByMatric = collect();
        if (!empty($legacyMatricNumbers)) {
            $studentsByMatric = Student::whereIn('matrixNumber', $legacyMatricNumbers)->get()->keyBy('matrixNumber');
        }

        // Fetch unregistered reporters
        $unregisteredReporters = collect();
        if (!empty($unregisteredIds)) {
            $unregisteredReporters = UnregisteredReporter::whereIn('_id', $unregisteredIds)->get()->keyBy(function($item) {
                return (string)$item->_id;
            });
        }

        // Transform reports with student and officer data
        $transformedReports = [];

        foreach ($recentReports as $report) {
            $reporterName = null;
            $reporterEmail = null;
            $reporterPhone = null;
            $reporterMatric = null;
            $reporterTypeDisplay = null;

            // Get reporter info
            if (isset($report->reporter_type)) {
                if ($report->reporter_type === 'registered' && $report->reporter_id && isset($students[(string)$report->reporter_id])) {
                    $student = $students[(string)$report->reporter_id];
                    $reporterName = $student->name;
                    $reporterEmail = $student->email;
                    $reporterPhone = $student->phone;
                    $reporterMatric = $student->matrixNumber;
                    $reporterTypeDisplay = 'Registered Student';
                }
                elseif ($report->reporter_type === 'unregistered' && $report->reporter_id && isset($unregisteredReporters[(string)$report->reporter_id])) {
                    $unregistered = $unregisteredReporters[(string)$report->reporter_id];
                    $reporterName = $unregistered->name;
                    $reporterEmail = $unregistered->email;
                    $reporterPhone = $unregistered->phone;
                    $reporterMatric = $unregistered->matric_number;
                    $reporterTypeDisplay = 'Unregistered Reporter';
                }
            }
            elseif (isset($report->studentId) && preg_match('/^[a-f0-9]{24}$/i', $report->studentId) && isset($students[(string)$report->studentId])) {
                $student = $students[(string)$report->studentId];
                $reporterName = $student->name;
                $reporterEmail = $student->email;
                $reporterPhone = $student->phone;
                $reporterMatric = $student->matrixNumber;
                $reporterTypeDisplay = 'Registered Student';
            }
            elseif (isset($report->studentId) && isset($studentsByMatric[$report->studentId])) {
                $student = $studentsByMatric[$report->studentId];
                $reporterName = $student->name;
                $reporterEmail = $student->email;
                $reporterPhone = $student->phone;
                $reporterMatric = $student->matrixNumber;
                $reporterTypeDisplay = 'Registered Student';
            }
            elseif (isset($report->studentName) && $report->studentName) {
                $reporterName = $report->studentName;
                $reporterEmail = $report->studentEmail ?? null;
                $reporterPhone = $report->studentPhone ?? null;
                $reporterMatric = $report->studentMatrix ?? null;
                $reporterTypeDisplay = 'Legacy Report';
            }
            else {
                $reporterName = 'Unknown Reporter';
                $reporterEmail = null;
                $reporterPhone = null;
                $reporterMatric = null;
                $reporterTypeDisplay = 'Unknown';
            }

            // Create a clean array for the frontend
            $reportData = [
                '_id' => (string)$report->_id,
                'reportId' => $report->reportId,
                'description' => $report->description,
                'status' => $report->status,
                'urgency' => $report->urgency,
                'incidentCategory' => $report->incidentCategory,
                'incidentDateTime' => $report->incidentDateTime,
                'reportedAt' => $report->reportedAt,
                'attachmentUrls' => $report->attachmentUrls ?? [],
                'studentName' => $reporterName,
                'studentEmail' => $reporterEmail,
                'studentPhone' => $reporterPhone,
                'studentMatrix' => $reporterMatric,
                'reporter_type_display' => $reporterTypeDisplay,
                'officerName' => ($report->assignedOfficer && isset($officers[$report->assignedOfficer])) ? $officers[$report->assignedOfficer]->officerName : 'Not Assigned',
            ];

            // CRITICAL: Add location data
            if (isset($report->location) && is_array($report->location)) {
                $reportData['locationRaw'] = $report->location;
                $reportData['locationArea'] = $report->location['locationArea'] ?? null;
                $reportData['building'] = $report->location['building'] ?? null;
                $reportData['address'] = $report->location['address'] ?? null;
                $reportData['specificPlace'] = $report->location['specificPlace'] ?? null;
            } else {
                $reportData['locationRaw'] = null;
                $reportData['locationArea'] = $report->mahallah ?? null;
                $reportData['building'] = $report->building ?? null;
                $reportData['address'] = $report->address ?? null;
                $reportData['specificPlace'] = null;
            }

            $transformedReports[] = $reportData;
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

        return response()->json([
            'recentReports' => $transformedReports,
            'stats' => $stats,
            'statusCounts' => $statusCounts,
            'lastUpdated' => now()->toDateTimeString(),
        ]);
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
