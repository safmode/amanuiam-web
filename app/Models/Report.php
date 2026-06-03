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
        'specificPlace', // Add specificPlace to fillable
    ];

    protected $casts = [
        'location' => 'array',
        'incidentDateTime' => 'datetime',
        'reportedAt' => 'datetime',
        'updatedAt' => 'datetime',
        'attachmentUrls' => 'array',
        'attachmentPublicIds' => 'array',
    ];

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
        // Check location array first
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
     * Get the building or specific location detail (block, office, store name, etc.)
     */
    public function getBuildingDetail()
    {
        $location = $this->location;

        if (is_array($location)) {
            // Return specificPlace if it exists
            if (isset($location['specificPlace']) && !empty($location['specificPlace'])) {
                return '';
            }

            if (isset($location['building']) && !empty($location['building'])) {
                return $location['building'];
            }
        }

        // Fallback to building field
        if (!empty($this->building)) {
            return $this->building;
        }

        return '';
    }

    /**
     * Get specific place name (like "7 Eleven", "Office", "Cafeteria")
     */
    public function getSpecificPlace()
    {
        $location = $this->location;

        if (is_array($location)) {
            // Check for specificPlace field first
            if (isset($location['specificPlace']) && !empty($location['specificPlace'])) {
                return $location['specificPlace'];
            }

            // Check if locationArea contains a known place name
            if (isset($location['locationArea']) && !empty($location['locationArea'])) {
                $locationArea = $location['locationArea'];
                $knownPlaces = ['7 eleven', 'seven eleven', 'office', 'cafe', 'cafeteria', 'library', 'gym', 'store', 'shop', 'restaurant', 'food court'];
                foreach ($knownPlaces as $place) {
                    if (stripos($locationArea, $place) !== false) {
                        return $locationArea; // Return the place name
                    }
                }
            }

            // Check building for place names
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

        // Fallback to specificPlace field (if we add it as a direct field)
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

        // Add location area if it exists and is valid
        if ($locationArea && $locationArea !== '') {
            $parts[] = $locationArea;
        }

        // Prioritize specificPlace (business names like "7 Eleven") over building
        if ($specificPlace && $specificPlace !== '') {
            $parts[] = $specificPlace;
        } elseif ($building && $building !== '') {
            $parts[] = $building;
        }

        // Add address if available and not already included
        $location = $this->location;
        if (is_array($location) && isset($location['address']) && !empty($location['address'])) {
            $address = $location['address'];
            // Only add if not already represented in parts
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
     * This is the primary method to get complete location data
     */
    public function getFullLocation()
    {
        $location = $this->location ?? [];

        if (!is_array($location)) {
            $location = [];
        }

        // Build the complete location array
        $fullLocation = [
            'locationArea' => $this->getLocationArea(),
            'specificPlace' => $this->getSpecificPlace(),
            'building' => $this->getBuildingDetail(),
            'address' => $location['address'] ?? $this->address ?? '',
            'fullAddress' => $this->getFullAddress(),
        ];

        // Preserve any existing coordinates if present
        if (isset($location['latitude']) && isset($location['longitude'])) {
            $fullLocation['latitude'] = $location['latitude'];
            $fullLocation['longitude'] = $location['longitude'];
        }

        if (isset($location['lat']) && isset($location['lng'])) {
            $fullLocation['lat'] = $location['lat'];
            $fullLocation['lng'] = $location['lng'];
        }

        // Preserve timestamp if present
        if (isset($location['timestamp'])) {
            $fullLocation['timestamp'] = $location['timestamp'];
        }

        return $fullLocation;
    }

    /**
     * Set location data with intelligent splitting
     * This method can be called before saving to ensure proper location structure
     */
    public function setLocationWithSplitting($address, $locationArea = null, $specificPlace = null, $building = null)
    {
        $location = [];

        // If location area is provided directly, use it
        if ($locationArea) {
            $location['locationArea'] = $locationArea;
        } else {
            // Try to extract location area from address
            $location['locationArea'] = $this->extractLocationAreaFromAddress($address);
        }

        // Set specific place or building
        if ($specificPlace) {
            $location['specificPlace'] = $specificPlace;
        } elseif ($building) {
            $location['building'] = $building;
        } else {
            // Try to extract specific place from address
            $extracted = $this->extractSpecificPlaceFromAddress($address);
            if ($extracted) {
                $location['specificPlace'] = $extracted;
            }
        }

        // Store the original address
        $location['address'] = $address;
        $location['timestamp'] = now()->toISOString();

        $this->location = $location;

        // Also set individual fields for backward compatibility
        $this->mahallah = $location['locationArea'] ?? '';
        $this->specificPlace = $location['specificPlace'] ?? '';
        $this->building = $location['building'] ?? '';
        $this->address = $address;

        return $this;
    }

    /**
     * Extract location area (Mahallah/Kulliyyah) from address
     */
    protected function extractLocationAreaFromAddress($address)
    {
        if (empty($address)) return '';

        $addressLower = strtolower($address);

        // Check for Mahallahs
        $mahallahs = [
            'asiah', 'aminah', 'safiyyah', 'maryam', 'ruqayyah',
            'ali', 'faruq', 'bilal', 'asma', 'hafsah', 'halimah',
            'siddiq', 'salahuddin', 'uthman', 'nusaibah', 'zubair', 'sumayyah'
        ];

        foreach ($mahallahs as $mahallah) {
            if (strpos($addressLower, $mahallah) !== false) {
                return 'Mahallah ' . ucfirst($mahallah);
            }
        }

        // Check for Kulliyyahs
        $kulliyyahs = [
            'kirkhs' => 'KIRKHS (AHAS KIRKHS)',
            'kict' => 'KICT (ICT)',
            'koe' => 'KOE (Engineering)',
            'kaed' => 'KAED (Architecture)',
            'kenms' => 'KENMS (Economics)',
            'aikol' => 'AIKOL (Law)',
            'koed' => 'KOED (Education)'
        ];

        foreach ($kulliyyahs as $key => $name) {
            if (strpos($addressLower, $key) !== false) {
                return $name;
            }
        }

        // Check for Facilities
        $facilities = [
            'library' => 'Dar al-Hikmah Library',
            'stadium' => 'Saidina Hamzah Stadium',
            'mosque' => 'Sultan Haji Ahmad Shah Mosque',
            'sports complex' => 'Female Sports Complex',
            'archery' => 'IIUM Archery Range',
            'football' => 'UIA Football Turf',
            'cricket' => 'IIUM Cricket Ground',
            'rugby' => 'IIUM Rugby Field',
            'educare' => 'IIUM Educare'
        ];

        foreach ($facilities as $keyword => $name) {
            if (strpos($addressLower, $keyword) !== false) {
                return $name;
            }
        }

        return '';
    }

    /**
     * Extract specific place from address
     */
    protected function extractSpecificPlaceFromAddress($address)
    {
        if (empty($address)) return '';

        $addressLower = strtolower($address);

        $specificPlaces = [
            '7 eleven', '7-eleven', 'seven eleven',
            'office', 'cafe', 'cafeteria', 'restaurant', 'food court',
            'gym', 'library', 'store', 'shop', 'convenience store',
            'kfc', 'mcdonald', 'starbucks', 'tealive', 'chatime',
            'clinic', 'pharmacy', 'bank', 'atm', 'laundry',
            'computer lab', 'study room', 'lecture hall', 'classroom',
            'auditorium', 'conference room', 'meeting room',
            'prayer room', 'surau', 'toilet', 'washroom'
        ];

        foreach ($specificPlaces as $place) {
            if (strpos($addressLower, $place) !== false) {
                // Return the original case version if possible
                $pattern = '/' . preg_quote($place, '/') . '/i';
                if (preg_match($pattern, $address, $matches)) {
                    return $matches[0];
                }
                return $place;
            }
        }

        // Check for building/room patterns
        $buildingPattern = '/(block|blk|building|bldg|tower|wing|floor|level|room|rm|suite|unit|no\.|#)\s+([a-z0-9\-]+)/i';
        if (preg_match($buildingPattern, $address, $matches)) {
            return trim($matches[0]);
        }

        return '';
    }

    /**
     * Get location as formatted string for display in lists
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

        // Auto-sync location data before saving
        static::saving(function ($model) {
            // If location is being set and it's an array, ensure it has all fields
            if ($model->location && is_array($model->location)) {
                // Sync individual fields from location array
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

            // If individual fields are set, sync to location array
            if (($model->mahallah || $model->specificPlace || $model->building || $model->address) &&
                (!$model->location || !is_array($model->location))) {
                $model->location = [
                    'locationArea' => $model->mahallah ?? '',
                    'specificPlace' => $model->specificPlace ?? '',
                    'building' => $model->building ?? '',
                    'address' => $model->address ?? '',
                    'timestamp' => now()->toISOString(),
                ];
            }
        });
    }
}
