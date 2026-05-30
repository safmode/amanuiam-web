<?php
// app/Http/Controllers/DigestController.php

namespace App\Http\Controllers;

use App\Models\Officer;
use App\Models\Report;
use App\Mail\DigestMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DigestController extends Controller
{
    /**
     * Send digest email
     */
    public function send(Request $request)
    {
        try {
            $admin = auth()->user();
            $type = $request->type;

            if (!in_array($type, ['weekly', 'monthly'])) {
                return response()->json(['message' => 'Invalid digest type'], 400);
            }

            // Prepare digest data - pass both admin and type
            $digestData = $this->prepareDigestData($admin, $type);

            // Log the data for debugging
            Log::info('Digest data prepared', [
                'total_reports' => $digestData['total_reports'] ?? 0,
                'officer_count' => count($digestData['officer_performance'] ?? []),
                'inactive_count' => count($digestData['inactive_officers_list'] ?? [])
            ]);

            // Send email
            Mail::to($admin->email)->send(new DigestMail($admin, $type, $digestData));

            Log::info('Digest sent successfully', [
                'admin' => $admin->email,
                'type' => $type
            ]);

            return response()->json([
                'message' => ucfirst($type) . ' digest sent successfully',
                'success' => true
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send digest: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to send digest: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Prepare comprehensive digest data with actual numbers
     */
    private function prepareDigestData($admin, $type)
    {
        $endDate = Carbon::now();

        if ($type === 'weekly') {
            $startDate = Carbon::now()->subWeek()->startOfWeek();
        } else {
            $startDate = Carbon::now()->subMonth()->startOfMonth();
        }

        // Log date range for debugging
        Log::info('Digest date range', [
            'start' => $startDate->toDateTimeString(),
            'end' => $endDate->toDateTimeString(),
            'type' => $type
        ]);

        // Get all reports in the period (for debugging)
        $allReportsInPeriod = Report::whereBetween('incidentDateTime', [$startDate, $endDate])->get();
        Log::info('Total reports in period: ' . $allReportsInPeriod->count());

        // Get all officers
        $officers = Officer::all();
        $officerPerformance = [];
        $inactiveOfficers = [];

        foreach ($officers as $officer) {
            // Try matching by officerId first, then by officerName
            $cases = Report::whereBetween('incidentDateTime', [$startDate, $endDate])
                ->where(function($query) use ($officer) {
                    $query->where('assignedOfficer', $officer->officerId)
                          ->orWhere('assignedOfficer', $officer->officerName);
                })
                ->get();

            $casesHandled = $cases->count();
            $resolvedCases = $cases->where('status', 'resolved')->count();
            $resolutionRate = $casesHandled > 0 ? round(($resolvedCases / $casesHandled) * 100) : 0;

            Log::info('Officer stats', [
                'name' => $officer->officerName,
                'id' => $officer->officerId,
                'cases' => $casesHandled,
                'resolved' => $resolvedCases,
                'rate' => $resolutionRate
            ]);

            if ($casesHandled > 0) {
                $officerPerformance[] = [
                    'name' => $officer->officerName,
                    'rank' => $officer->rank,
                    'department' => $officer->department,
                    'cases_handled' => $casesHandled,
                    'resolved_cases' => $resolvedCases,
                    'resolution_rate' => $resolutionRate,
                ];
            } else {
                $inactiveOfficers[] = [
                    'name' => $officer->officerName,
                    'rank' => $officer->rank,
                    'department' => $officer->department,
                ];
            }
        }

        // Sort by cases handled (descending)
        usort($officerPerformance, function($a, $b) {
            return $b['cases_handled'] <=> $a['cases_handled'];
        });

        // Calculate department performance
        $departments = Officer::distinct('department')->pluck('department');
        $departmentPerformance = [];

        foreach ($departments as $dept) {
            $deptOfficers = Officer::where('department', $dept)->get();
            $totalCases = 0;
            $totalResolved = 0;
            $activeCount = 0;

            foreach ($deptOfficers as $officer) {
                $cases = Report::whereBetween('incidentDateTime', [$startDate, $endDate])
                    ->where(function($query) use ($officer) {
                        $query->where('assignedOfficer', $officer->officerId)
                              ->orWhere('assignedOfficer', $officer->officerName);
                    })
                    ->count();
                $resolved = Report::whereBetween('incidentDateTime', [$startDate, $endDate])
                    ->where(function($query) use ($officer) {
                        $query->where('assignedOfficer', $officer->officerId)
                              ->orWhere('assignedOfficer', $officer->officerName);
                    })
                    ->where('status', 'resolved')
                    ->count();

                if ($cases > 0) {
                    $activeCount++;
                    $totalCases += $cases;
                    $totalResolved += $resolved;
                }
            }

            if ($totalCases > 0) {
                $departmentPerformance[] = [
                    'department' => $dept,
                    'active_officers' => $activeCount,
                    'cases_handled' => $totalCases,
                    'resolution_rate' => round(($totalResolved / $totalCases) * 100),
                ];
            }
        }

        usort($departmentPerformance, function($a, $b) {
            return $b['cases_handled'] <=> $a['cases_handled'];
        });

        // Get report statistics
        $reports = Report::whereBetween('incidentDateTime', [$startDate, $endDate])->get();

        $statusStats = [
            'pending' => $reports->where('status', 'pending')->count(),
            'inProgress' => $reports->where('status', 'inProgress')->count(),
            'resolved' => $reports->where('status', 'resolved')->count(),
            'nfa' => $reports->where('status', 'nfa')->count(),
        ];

        // Calculate urgency stats
        $urgencyStats = [
            'urgent' => $reports->where('urgency', 'urgent')->count(),
            'general' => $reports->where('urgency', 'general')->count(),
        ];

        // Calculate resolution rate
        $totalReports = $reports->count();
        $resolvedReports = $statusStats['resolved'];
        $resolutionRate = $totalReports > 0 ? round(($resolvedReports / $totalReports) * 100) : 0;

        // Calculate average response time
        $responseTimes = [];
        foreach ($reports as $report) {
            if ($report->status !== 'pending') {
                $responseTime = $report->updated_at->diffInHours($report->created_at);
                $responseTimes[] = $responseTime;
            }
        }
        $avgResponseTime = !empty($responseTimes) ? round(array_sum($responseTimes) / count($responseTimes)) : 0;

        // Get recent reports for the period
        $recentReports = $reports->sortByDesc('incidentDateTime')->take(5)->map(function($report) {
            $categoryLabels = [
                'theft' => 'Theft/Robbery',
                'harassment' => 'Harassment',
                'vandalism' => 'Vandalism',
                'fireHazard' => 'Fire Hazard',
                'suspiciousActivity' => 'Suspicious Activity',
                'facilityIssue' => 'Facility Issue',
                'wildAnimal' => 'Wild Animal',
                'trespassing' => 'Trespassing',
                'emergencyAlert' => 'Emergency Alert',
                'other' => 'Other',
            ];

            return [
                'id' => $report->reportId,
                'description' => substr($report->description, 0, 100),
                'category' => $categoryLabels[$report->incidentCategory] ?? $report->incidentCategory,
                'location' => $report->mahallah ?? 'Unknown',
                'date' => $report->incidentDateTime->format('M d, Y'),
                'status' => ucfirst(str_replace('_', ' ', $report->status)),
                'urgency' => ucfirst($report->urgency),
            ];
        })->toArray();

        return [
            'admin_name' => $admin->name,
            'date_range' => $startDate->format('M d, Y') . ' - ' . $endDate->format('M d, Y'),
            'total_reports' => $totalReports,
            'resolution_rate' => $resolutionRate,
            'avg_response_time' => $avgResponseTime,
            'total_officers' => $officers->count(),
            'active_officers' => count($officerPerformance),
            'inactive_officers' => count($inactiveOfficers),
            'inactive_officers_list' => $inactiveOfficers,
            'total_cases_handled' => array_sum(array_column($officerPerformance, 'cases_handled')),
            'officer_performance' => $officerPerformance,
            'department_performance' => $departmentPerformance,
            'status_stats' => $statusStats,
            'urgency_stats' => $urgencyStats,
            'recent_reports' => $recentReports,
        ];
    }
}
