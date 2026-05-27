<?php
//An event listener that updates the casesHandled count for officers whenever a report is created, updated, or deleted. This ensures that the casesHandled count is always accurate without needing to calculate it on the fly in the controller.
namespace App\Observers;

use App\Models\Report;
use App\Models\Officer;

class ReportObserver
{
    public function saved(Report $report)
    {
        if ($report->assignedOfficer) {
            $casesHandled = Report::where('assignedOfficer', $report->assignedOfficer)->count();
            Officer::where('officerName', $report->assignedOfficer)->update(['casesHandled' => $casesHandled]);
        }
    }

    public function deleted(Report $report)
    {
        if ($report->assignedOfficer) {
            $casesHandled = Report::where('assignedOfficer', $report->assignedOfficer)->count();
            Officer::where('officerName', $report->assignedOfficer)->update(['casesHandled' => $casesHandled]);
        }
    }
}
