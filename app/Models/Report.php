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
        'mahallah',
        'building',
        'address',
        'specificPlace',
    ];

    // Only cast dates, NOT location (MongoDB handles arrays natively)
    protected $casts = [
        'incidentDateTime' => 'datetime',
        'reportedAt' => 'datetime',
        'updatedAt' => 'datetime',
    ];

    /**
     * Get the location attribute safely
     */
    public function getLocationAttribute($value)
    {
        // If it's already an array, return it directly
        if (is_array($value)) {
            return $value;
        }

        // If it's a string, try to decode it
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }

        return [];
    }

    /**
     * Set the location attribute safely
     */
    public function setLocationAttribute($value)
    {
        // If it's an array, store it directly (MongoDB will handle it)
        if (is_array($value)) {
            $this->attributes['location'] = $value;
        }
        // If it's a string, try to decode it
        elseif (is_string($value)) {
            $decoded = json_decode($value, true);
            $this->attributes['location'] = is_array($decoded) ? $decoded : [];
        }
        else {
            $this->attributes['location'] = [];
        }
    }

    /**
     * Generate sequential Report ID
     */
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

        if (is_array($location) && isset($location['locationArea']) && !empty($location['locationArea'])) {
            $locationArea = $location['locationArea'];

            // If locationArea contains a place name, return empty (it should be in specificPlace)
            $placeNames = ['7 eleven', 'seven eleven', 'office', 'cafe', 'cafeteria', 'library', 'gym', 'store', 'shop', 'restaurant', 'food court'];
            foreach ($placeNames as $place) {
                if (stripos($locationArea, $place) !== false) {
                    return '';
                }
            }

            return $locationArea;
        }

        // Fallback to mahallah field
        if (!empty($this->mahallah)) {
            return $this->mahallah;
        }

        return '';
    }

    /**
     * Get the building or specific location detail
     */
    public function getBuildingDetail()
    {
        $location = $this->location;

        if (is_array($location)) {
            if (isset($location['specificPlace']) && !empty($location['specificPlace'])) {
                return '';
            }

            if (isset($location['building']) && !empty($location['building'])) {
                return $location['building'];
            }
        }

        if (!empty($this->building)) {
            return $this->building;
        }

        return '';
    }

    /**
     * Get specific place name
     */
    public function getSpecificPlace()
    {
        $location = $this->location;

        if (is_array($location)) {
            if (isset($location['specificPlace']) && !empty($location['specificPlace'])) {
                return $location['specificPlace'];
            }

            if (isset($location['locationArea']) && !empty($location['locationArea'])) {
                $locationArea = $location['locationArea'];
                $knownPlaces = ['7 eleven', 'seven eleven', 'office', 'cafe', 'cafeteria', 'library', 'gym', 'store', 'shop', 'restaurant', 'food court'];
                foreach ($knownPlaces as $place) {
                    if (stripos($locationArea, $place) !== false) {
                        return $locationArea;
                    }
                }
            }

            if (isset($location['building']) && !empty($location['building'])) {
                $building = $location['building'];
                $knownPlaces = ['7 eleven', 'seven eleven', 'office', 'cafe', 'cafeteria', 'library', 'gym', 'store', 'shop', 'restaurant', 'food court'];
                foreach ($knownPlaces as $place) {
                    if (stripos($building, $place) !== false) {
                        return $building;
                    }
                }
            }
        }

        if (!empty($this->specificPlace)) {
            return $this->specificPlace;
        }

        return '';
    }

    /**
     * Check if location has a specific place name
     */
    public function hasSpecificPlace()
    {
        return !empty($this->getSpecificPlace());
    }

    /**
     * Get the full address by combining location area and building/specific place
     */
    public function getFullAddress()
    {
        $locationArea = $this->getLocationArea();
        $specificPlace = $this->getSpecificPlace();
        $building = $this->getBuildingDetail();

        $parts = [];

        if ($locationArea && $locationArea !== '') {
            $parts[] = $locationArea;
        }

        if ($specificPlace && $specificPlace !== '') {
            $parts[] = $specificPlace;
        } elseif ($building && $building !== '') {
            $parts[] = $building;
        }

        $location = $this->location;
        if (is_array($location) && isset($location['address']) && !empty($location['address'])) {
            $address = $location['address'];
            if (!in_array($address, $parts)) {
                $parts[] = $address;
            }
        } elseif (!empty($this->address) && !in_array($this->address, $parts)) {
            $parts[] = $this->address;
        }

        return !empty($parts) ? implode(', ', $parts) : 'No address specified';
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

        return [
            'locationArea' => $this->getLocationArea(),
            'specificPlace' => $this->getSpecificPlace(),
            'building' => $this->getBuildingDetail(),
            'address' => $location['address'] ?? $this->address ?? '',
            'fullAddress' => $this->getFullAddress(),
        ];
    }

    /**
     * Get short location for display
     */
    public function getShortLocation()
    {
        $locationArea = $this->getLocationArea();
        $specificPlace = $this->getSpecificPlace();

        if ($specificPlace) {
            return $specificPlace;
        }

        if ($locationArea) {
            return $locationArea;
        }

        return $this->getFullAddress();
    }

    /**
     * Check if location has coordinates
     */
    public function hasCoordinates()
    {
        $location = $this->location;

        if (is_array($location)) {
            return (isset($location['latitude']) && isset($location['longitude']) &&
                    $location['latitude'] != 0 && $location['longitude'] != 0) ||
                   (isset($location['lat']) && isset($location['lng']) &&
                    $location['lat'] != 0 && $location['lng'] != 0);
        }

        return false;
    }

    /**
     * Get coordinates as array
     */
    public function getCoordinates()
    {
        $location = $this->location;

        if (is_array($location)) {
            if (isset($location['latitude']) && isset($location['longitude']) &&
                $location['latitude'] != 0 && $location['longitude'] != 0) {
                return ['lat' => (float)$location['latitude'], 'lng' => (float)$location['longitude']];
            }

            if (isset($location['lat']) && isset($location['lng']) &&
                $location['lat'] != 0 && $location['lng'] != 0) {
                return ['lat' => (float)$location['lat'], 'lng' => (float)$location['lng']];
            }
        }

        return null;
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($model) {
            if ($model->location && is_array($model->location)) {
                if (isset($model->location['locationArea'])) {
                    $model->mahallah = $model->location['locationArea'];
                }
                if (isset($model->location['specificPlace'])) {
                    $model->specificPlace = $model->location['specificPlace'];
                }
                if (isset($model->location['building'])) {
                    $model->building = $model->location['building'];
                }
                if (isset($model->location['address'])) {
                    $model->address = $model->location['address'];
                }
            }

            if (($model->mahallah || $model->specificPlace || $model->building || $model->address) &&
                (!$model->location || !is_array($model->location))) {
                $model->location = [
                    'locationArea' => $model->mahallah ?? '',
                    'specificPlace' => $model->specificPlace ?? '',
                    'building' => $model->building ?? '',
                    'address' => $model->address ?? '',
                ];
            }
        });
    }
}
