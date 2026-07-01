<?php
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
        $this->initLocationMatching();
    }

    public function getRecentReports(Request $request)
    {
        try {
            // USE THE SAME METHOD AS ReportController
            $recentReports = Report::orderBy('reportedAt', 'desc')
                ->limit(10)
                ->get();

            // Transform reports with location data - SAME AS ReportController
            $recentReports->transform(function ($report) {
                // ADD DETERMINED LOCATION - SAME AS ReportController
                $report->determinedLocation = $this->determineReportLocation($report);
                $report->specificAddress = $this->getOriginalLocationText($report);
                $locationArea = $this->getLocationAreaFromReport($report);
                $report->locationArea = $locationArea;

                // Get reporter info
                if ($report->reporter_type === 'registered' && $report->reporter_id) {
                    $student = Student::find($report->reporter_id);
                    if ($student) {
                        $report->studentName = $student->name;
                        $report->studentEmail = $student->email;
                        $report->studentPhone = $student->phone;
                        $report->studentMatrix = $student->matrixNumber;
                    }
                } elseif ($report->reporter_type === 'unregistered' && $report->reporter_id) {
                    $unregistered = UnregisteredReporter::find($report->reporter_id);
                    if ($unregistered) {
                        $report->studentName = $unregistered->name;
                        $report->studentEmail = $unregistered->email;
                        $report->studentPhone = $unregistered->phone;
                        $report->studentMatrix = $unregistered->matric_number;
                    }
                }

                return $report;
            });

            // Get stats
            $stats = [
                'totalReports' => Report::count(),
                'pendingReports' => Report::where('status', 'pending')->count(),
                'inProgressReports' => Report::where('status', 'inProgress')->count(),
                'resolvedReports' => Report::where('status', 'resolved')->count(),
                'nfaReports' => Report::where('status', 'nfa')->count(),
                'emergencyAlerts' => Report::where('urgency', 'urgent')->where('status', '!=', 'resolved')->count(),
            ];

            return response()->json([
                'success' => true,
                'recentReports' => $recentReports, // THIS ALREADY HAS determinedLocation
                'stats' => $stats,
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
