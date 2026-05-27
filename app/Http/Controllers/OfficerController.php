<?php

namespace App\Http\Controllers;

use App\Models\Officer;
use App\Models\Report;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Pagination\LengthAwarePaginator;
use Carbon\Carbon;

class OfficerController extends Controller
{
    public function index(Request $request)
    {
        $query = Officer::query();

        // Search filter
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('officerName', 'like', "%$search%")
                ->orWhere('rank', 'like', "%$search%")
                ->orWhere('department', 'like', "%$search%")
                ->orWhere('phone', 'like', "%$search%");
            });
        }

        // Rank filter
        if ($ranks = $request->get('rank')) {
            $rankArray = explode(',', $ranks);
            $query->whereIn('rank', $rankArray);
        }

        // Department filter
        if ($departments = $request->get('department')) {
            $deptArray = explode(',', $departments);
            $query->whereIn('department', $deptArray);
        }

        // Date filters for reports
        $dateFrom = $request->get('dateFrom');
        $dateTo = $request->get('dateTo');
        $dateFilterType = $request->get('dateFilterType', 'all');

        // Get all officers
        $officersCollection = $query->orderBy('officerName', 'asc')->get();

        // Build report query with date filters
        $reportQuery = Report::query();

        if ($dateFrom) {
            $reportQuery->whereDate('incidentDateTime', '>=', $dateFrom);
        }
        if ($dateTo) {
            $reportQuery->whereDate('incidentDateTime', '<=', $dateTo);
        }

        // Calculate metrics for each officer from the filtered reports
        $officersCollection = $officersCollection->map(function ($officer) use ($reportQuery) {
            // Clone the query for each officer to avoid modifying the original
            $officerReportQuery = clone $reportQuery;

            $totalCases = $officerReportQuery->where('assignedOfficer', $officer->officerId)->count();

            $resolvedQuery = clone $reportQuery;
            $resolvedCases = $resolvedQuery->where('assignedOfficer', $officer->officerId)
                ->where('status', 'resolved')
                ->count();

            $responseRate = $totalCases > 0 ? round(($resolvedCases / $totalCases) * 100) : 0;

            $officer->casesHandled = $totalCases;
            $officer->responseRate = $responseRate;

            return $officer;
        });

        // Manual pagination
        $perPage = 10;
        $currentPage = $request->get('page', 1);
        $offset = ($currentPage - 1) * $perPage;

        $paginatedOfficers = $officersCollection->slice($offset, $perPage)->values();
        $total = $officersCollection->count();

        $officers = new LengthAwarePaginator(
            $paginatedOfficers,
            $total,
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        $ranks = Officer::distinct('rank')
            ->where('rank', '!=', '')
            ->whereNotNull('rank')
            ->pluck('rank')
            ->filter()
            ->values()
            ->toArray();

        $departments = Officer::distinct('department')
            ->where('department', '!=', '')
            ->whereNotNull('department')
            ->pluck('department')
            ->filter()
            ->values()
            ->toArray();

        // If still empty, use the actual values from the officers collection
        if (empty($ranks)) {
            $ranks = $officersCollection->pluck('rank')->filter()->unique()->values()->toArray();
        }

        if (empty($departments)) {
            $departments = $officersCollection->pluck('department')->filter()->unique()->values()->toArray();
        }

        return Inertia::render('Officers', [
            'officers' => $officers,
            'ranks' => $ranks,
            'departments' => $departments,
            'filters' => $request->only(['search', 'rank', 'department']),
            'dateFilterType' => $dateFilterType,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
        ]);
    }

    public function getOfficersList()
    {
        $officers = Officer::select('officerId', 'officerName')->orderBy('officerName')->get();
        return response()->json($officers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'officerName' => 'required|string',
            'rank' => 'required|string',
            'department' => 'required|string',
            'phone' => 'required|string',
            'email' => 'nullable|email',
            'telegram_chat_id' => 'nullable|string',
            'receive_emergency' => 'boolean',
            'receive_daily_digest' => 'boolean',
        ]);

        $latestOfficer = Officer::orderBy('officerId', 'desc')->first();
        if ($latestOfficer && $latestOfficer->officerId && preg_match('/OFF-(\d+)/', $latestOfficer->officerId, $matches)) {
            $nextNumber = (int)$matches[1] + 1;
        } else {
            $nextNumber = 1;
        }

        $validated['officerId'] = 'OFF-' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
        $validated['casesHandled'] = 0;
        $validated['responseRate'] = 0;
        $validated['role'] = 'officer';
        $validated['status'] = 'active';

        Officer::create($validated);

        return redirect()->route('officers')->with('success', 'Officer added successfully.');
    }

    public function update(Request $request, $officerId)
    {
        $officer = Officer::where('officerId', $officerId)->firstOrFail();
        $oldOfficerName = $officer->officerName;

        $validated = $request->validate([
            'officerName' => 'sometimes|required|string',
            'rank' => 'sometimes|required|string',
            'department' => 'sometimes|required|string',
            'phone' => 'sometimes|required|string',
            'email' => 'nullable|email',
            'telegram_chat_id' => 'nullable|string',  
            'receive_emergency' => 'boolean',
            'receive_daily_digest' => 'boolean',
        ]);

        $officer->update($validated);

        // If name changed, update all reports that had this officer assigned
        if (isset($validated['officerName']) && $validated['officerName'] !== $oldOfficerName) {
            Report::where('assignedOfficer', $oldOfficerName)->update(['assignedOfficer' => $validated['officerName']]);
        }

        // Recalculate metrics (no date filter for updates, use all time)
        $totalCases = Report::where('assignedOfficer', $officer->officerName)->count();
        $resolvedCases = Report::where('assignedOfficer', $officer->officerName)
            ->where('status', 'resolved')
            ->count();
        $responseRate = $totalCases > 0 ? round(($resolvedCases / $totalCases) * 100) : 0;

        $officer->casesHandled = $totalCases;
        $officer->responseRate = $responseRate;
        $officer->save();

        return redirect()->route('officers')->with('success', 'Officer updated successfully.');
    }

    public function destroy($officerId)
    {
        $officer = Officer::where('officerId', $officerId)->firstOrFail();

        // Unassign reports from this officer
        Report::where('assignedOfficer', $officer->officerId)->update(['assignedOfficer' => null]);

        $officer->delete();

        return redirect()->route('officers')->with('success', 'Officer deleted successfully.');
    }
}
