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
        $recentReports->transform(function ($report) use ($officers, $students, $studentsByMatric, $unregisteredReporters) {
            $reporterName = null;
            $reporterEmail = null;
            $reporterPhone = null;
            $reporterMatric = null;
            $reporterTypeDisplay = null;

            // NEW FORMAT: Has reporter_type
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
            // LEGACY FORMAT 1: studentId is ObjectId
            elseif (isset($report->studentId) && preg_match('/^[a-f0-9]{24}$/i', $report->studentId) && isset($students[(string)$report->studentId])) {
                $student = $students[(string)$report->studentId];
                $reporterName = $student->name;
                $reporterEmail = $student->email;
                $reporterPhone = $student->phone;
                $reporterMatric = $student->matrixNumber;
                $reporterTypeDisplay = 'Registered Student';
            }
            // LEGACY FORMAT 2: studentId is matric number
            elseif (isset($report->studentId) && isset($studentsByMatric[$report->studentId])) {
                $student = $studentsByMatric[$report->studentId];
                $reporterName = $student->name;
                $reporterEmail = $student->email;
                $reporterPhone = $student->phone;
                $reporterMatric = $student->matrixNumber;
                $reporterTypeDisplay = 'Registered Student';
            }
            // LEGACY FORMAT 3: Has studentName directly in report
            elseif (isset($report->studentName) && $report->studentName) {
                $reporterName = $report->studentName;
                $reporterEmail = $report->studentEmail ?? null;
                $reporterPhone = $report->studentPhone ?? null;
                $reporterMatric = $report->studentMatrix ?? null;
                $reporterTypeDisplay = 'Legacy Report';
            }
            // Fallback
            else {
                $reporterName = 'Unknown Reporter';
                $reporterEmail = null;
                $reporterPhone = null;
                $reporterMatric = null;
                $reporterTypeDisplay = 'Unknown';
            }

            // Set the fields for the frontend
            $report->studentName = $reporterName;
            $report->studentEmail = $reporterEmail;
            $report->studentPhone = $reporterPhone;
            $report->studentMatrix = $reporterMatric;
            $report->reporter_type_display = $reporterTypeDisplay;

            // ========== FIX: ADD LOCATION DATA ==========
            // Extract location data from the location object
            if (isset($report->location) && is_array($report->location)) {
                $report->locationArea = $report->location['locationArea'] ?? null;
                $report->building = $report->location['building'] ?? null;
                $report->address = $report->location['address'] ?? null;
                $report->specificPlace = $report->location['specificPlace'] ?? null;
                $report->locationRaw = $report->location; // Keep original for reference
            } else {
                // Fallback to existing fields
                $report->locationArea = $report->mahallah ?? null;
                $report->building = $report->building ?? null;
                $report->address = $report->address ?? null;
                $report->specificPlace = null;
                $report->locationRaw = null;
            }
            // ========== END FIX ==========

            // Load officer name from assignedOfficer
            if ($report->assignedOfficer && isset($officers[$report->assignedOfficer])) {
                $officer = $officers[$report->assignedOfficer];
                $report->officerName = $officer->officerName;
            } else {
                $report->officerName = 'Not Assigned';
            }

            return $report;
        });

        // Get ALL statistics for dashboard - Reports stats
        $statusCounts = [
            'pending' => Report::where('status', 'pending')->count(),
            'inProgress' => Report::where('status', 'inProgress')->count(),
            'resolved' => Report::where('status', 'resolved')->count(),
            'nfa' => Report::where('status', 'nfa')->count(),
        ];

        // Get emergency alerts count from emergencies collection - ONLY ACTIVE AND RESPONDING (not resolved)
        $activeEmergencies = Emergencies::where('status', 'active')->count();
        $respondingEmergencies = Emergencies::where('status', 'responding')->count();

        // Total emergencies that need attention (active + responding, NOT including resolved)
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
            'recentReports' => $recentReports,
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
