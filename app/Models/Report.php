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

    /**
     * Get the location area (main area like Mahallah, Faculty, etc.)
     */
    public function getLocationArea()
    {
        $location = $this->location;

        if (is_array($location) && isset($location['locationArea'])) {
            return $location['locationArea'];
        }

        return $this->mahallah ?? '';
    }

    /**
     * Get the building or specific location detail (block, office, store name, etc.)
     */
    public function getBuildingDetail()
    {
        $location = $this->location;

        if (is_array($location) && isset($location['building'])) {
            return $location['building'];
        }

        // Check for specific place name (like "7 Eleven", "Office", "Cafe")
        if (is_array($location) && isset($location['specificPlace'])) {
            return $location['specificPlace'];
        }

        return $this->building ?? '';
    }

    /**
     * Get the full address by combining location area and building/specific place
     */
    public function getFullAddress()
    {
        $locationArea = $this->getLocationArea();
        $building = $this->getBuildingDetail();
        $specificPlace = $this->getSpecificPlace();

        $parts = [];

        if ($locationArea) {
            $parts[] = $locationArea;
        }

        // If there's a specific place (like "7 Eleven", "Office"), add it
        if ($specificPlace && $specificPlace !== '') {
            $parts[] = $specificPlace;
        }
        // Otherwise add building if available
        elseif ($building && $building !== '') {
            $parts[] = $building;
        }

        // Add address if available and not already included
        if (is_array($this->location) && isset($this->location['address']) && $this->location['address']) {
            $address = $this->location['address'];
            // Only add if not already represented in parts
            if (!in_array($address, $parts)) {
                $parts[] = $address;
            }
        }

        return !empty($parts) ? implode(', ', $parts) : 'No address specified';
    }

    /**
     * Get specific place name (like "7 Eleven", "Office", "Cafeteria")
     */
    public function getSpecificPlace()
    {
        $location = $this->location;

        if (is_array($location)) {
            // Check for specificPlace field
            if (isset($location['specificPlace']) && $location['specificPlace']) {
                return $location['specificPlace'];
            }

            // Check if building contains a known place name
            if (isset($location['building']) && $location['building']) {
                $building = $location['building'];
                $knownPlaces = ['7 Eleven', 'Office', 'Cafe', 'Cafeteria', 'Library', 'Gym', 'Store', 'Shop', 'Restaurant', 'Food Court'];
                foreach ($knownPlaces as $place) {
                    if (stripos($building, $place) !== false) {
                        return $building;
                    }
                }
            }
        }

        return '';
    }

    /**
     * Get the full location array with all details
     */
    public function getFullLocation()
    {
        $location = $this->location ?? [];

        if (!is_array($location)) {
            $location = [];
        }

        // Ensure all standard fields exist
        return [
            'locationArea' => $location['locationArea'] ?? $this->mahallah ?? '',
            'building' => $location['building'] ?? $this->building ?? '',
            'specificPlace' => $location['specificPlace'] ?? $this->getSpecificPlace(),
            'address' => $location['address'] ?? $this->address ?? '',
            'fullAddress' => $this->getFullAddress(),
        ];
    }

    /**
     * Determine if location has a specific place name
     */
    public function hasSpecificPlace()
    {
        return !empty($this->getSpecificPlace());
    }
}
