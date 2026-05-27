<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Report extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'reports';

    protected $fillable = [
        'reportId',
        'reporter_type',
        'reporter_id',
        'incidentCategory',
        'description',
        'location',
        'status',
        'incidentDateTime',
        'injuries',
        'attachmentUrls',
        'attachmentPublicIds',
        'reportedAt',
        'updatedAt',
        'assignedOfficer',
        'urgency',
        'officerNotes',
        'damages',
        'suspectDescription',
        'studentId',
    ];

    public static function generateReportId()
    {
        $year = now()->format('Y');

        // Get the last report ID for this year
        $lastReport = self::where('reportId', 'like', "RPT-{$year}-%")
            ->orderBy('reportId', 'desc')
            ->first();

        if ($lastReport) {
            preg_match('/RPT-' . $year . '-(\d+)/', $lastReport->reportId, $matches);
            $lastNumber = isset($matches[1]) ? intval($matches[1]) : 0;
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        // Format with leading zeros (001, 002, etc.)
        $formattedNumber = str_pad($newNumber, 3, '0', STR_PAD_LEFT);
        $reportId = "RPT-{$year}-{$formattedNumber}";

        // Check for collision (race condition safety)
        $counter = 0;
        while (self::where('reportId', $reportId)->exists() && $counter < 10) {
            $newNumber++;
            $formattedNumber = str_pad($newNumber, 3, '0', STR_PAD_LEFT);
            $reportId = "RPT-{$year}-{$formattedNumber}";
            $counter++;
        }

        return $reportId;
    }

    public function getLocationArea()
    {
        $location = $this->location;

        if (is_array($location) && isset($location['locationArea'])) {
            return $location['locationArea'];
        }

        return $this->mahallah ?? '';
    }

    public function getBuildingDetail()
    {
        $location = $this->location;

        if (is_array($location) && isset($location['building'])) {
            return $location['building'];
        }

        return $this->building ?? '';
    }

    public function getFullAddress()
    {
        $locationArea = $this->getLocationArea();
        $building = $this->getBuildingDetail();

        if ($building && $building !== '') {
            return $locationArea . ', ' . $building;
        }
        return $locationArea ?: 'No address specified';
    }
}
