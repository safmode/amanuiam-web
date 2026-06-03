<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;

trait LocationMatchingTrait
{
    private $mainLocations = [
        // Mahallahs
        'Mahallah Asiah' => ['keywords' => ['asiah', 'mahallah asiah'], 'radius' => 200, 'key' => 'Asiah'],
        'Mahallah Aminah' => ['keywords' => ['aminah', 'mahallah aminah'], 'radius' => 200, 'key' => 'Aminah'],
        'Mahallah Safiyyah' => ['keywords' => ['safiyyah', 'mahallah safiyyah'], 'radius' => 200, 'key' => 'Safiyyah'],
        'Mahallah Maryam' => ['keywords' => ['maryam', 'mahallah maryam'], 'radius' => 200, 'key' => 'Maryam'],
        'Mahallah Ruqayyah' => ['keywords' => ['ruqayyah', 'mahallah ruqayyah'], 'radius' => 200, 'key' => 'Ruqayyah'],
        'Mahallah Ali' => ['keywords' => ['ali', 'mahallah ali'], 'radius' => 200, 'key' => 'Ali'],
        'Mahallah Faruq' => ['keywords' => ['faruq', 'mahallah faruq'], 'radius' => 200, 'key' => 'Faruq'],
        'Mahallah Bilal' => ['keywords' => ['bilal', 'mahallah bilal'], 'radius' => 200, 'key' => 'Bilal'],
        'Mahallah Asma' => ['keywords' => ['asma', 'mahallah asma'], 'radius' => 200, 'key' => 'Asma'],
        'Mahallah Hafsah' => ['keywords' => ['hafsah', 'mahallah hafsah'], 'radius' => 200, 'key' => 'Hafsah'],
        'Mahallah Halimah' => ['keywords' => ['halimah', 'mahallah halimah'], 'radius' => 200, 'key' => 'Halimah'],
        'Mahallah Siddiq' => ['keywords' => ['siddiq', 'mahallah siddiq'], 'radius' => 200, 'key' => 'Siddiq'],
        'Mahallah Salahuddin' => ['keywords' => ['salahuddin', 'mahallah salahuddin'], 'radius' => 200, 'key' => 'Salahuddin'],
        'Mahallah Uthman' => ['keywords' => ['uthman', 'mahallah uthman'], 'radius' => 200, 'key' => 'Uthman'],
        'Mahallah Nusaibah' => ['keywords' => ['nusaibah', 'mahallah nusaibah'], 'radius' => 200, 'key' => 'Nusaibah'],
        'Mahallah Zubair Al-Awwam' => ['keywords' => ['zubair', 'mahallah zubair'], 'radius' => 200, 'key' => 'Zubair Al-Awwam'],
        'Mahallah Sumayyah' => ['keywords' => ['sumayyah', 'mahallah sumayyah'], 'radius' => 200, 'key' => 'Sumayyah'],

        // Kulliyyahs
        'KIRKHS (AHAS KIRKHS)' => ['keywords' => ['kirkhs', 'kulliyyah of human sciences'], 'radius' => 150, 'key' => 'KIRKHS'],
        'KICT (ICT)' => ['keywords' => ['kict', 'ict', 'information technology'], 'radius' => 200, 'key' => 'KICT'],
        'KOE (Engineering)' => ['keywords' => ['koe', 'engineering'], 'radius' => 150, 'key' => 'KOE'],
        'KAED (Architecture)' => ['keywords' => ['kaed', 'architecture'], 'radius' => 150, 'key' => 'KAED'],
        'KENMS (Economics)' => ['keywords' => ['kenms', 'economics'], 'radius' => 150, 'key' => 'KENMS'],
        'AIKOL (Law)' => ['keywords' => ['aikol', 'law'], 'radius' => 150, 'key' => 'AIKOL'],
        'KOED (Education)' => ['keywords' => ['koed', 'education'], 'radius' => 150, 'key' => 'KOED'],

        // Facilities
        'Dar al-Hikmah Library' => ['keywords' => ['library', 'dar al-hikmah'], 'radius' => 100, 'key' => 'Dar al-Hikmah Library'],
        'Female Sports Complex' => ['keywords' => ['female sports', 'sports complex', 'gym'], 'radius' => 150, 'key' => 'Female Sports Complex'],
        'Saidina Hamzah Stadium' => ['keywords' => ['stadium', 'saidina hamzah'], 'radius' => 200, 'key' => 'Saidina Hamzah Stadium'],
        'IIUM Archery Range' => ['keywords' => ['archery', 'panahan'], 'radius' => 100, 'key' => 'IIUM Archery Range'],
        'UIA Football Turf' => ['keywords' => ['football', 'soccer', 'turf'], 'radius' => 120, 'key' => 'UIA Football Turf'],
        'IIUM Cricket Ground' => ['keywords' => ['cricket', 'ground'], 'radius' => 150, 'key' => 'IIUM Cricket Ground'],
        'IIUM Rugby Field' => ['keywords' => ['rugby', 'field'], 'radius' => 150, 'key' => 'IIUM Rugby Field'],
        'Padang Kawad UIAM' => ['keywords' => ['padang kawad', 'parade'], 'radius' => 150, 'key' => 'Padang Kawad UIAM'],
        'IIUM Educare' => ['keywords' => ['educare', 'kindergarten'], 'radius' => 100, 'key' => 'IIUM Educare'],
        'Sultan Haji Ahmad Shah Mosque' => ['keywords' => ['mosque', 'masjid'], 'radius' => 150, 'key' => 'Sultan Haji Ahmad Shah Mosque'],
    ];

    private $mainLocationCoordinates = [];

    /**
     * Initialize the trait (call this in controller constructor)
     */
    protected function initLocationMatching()
    {
        if (file_exists(config_path('map_coordinates.php'))) {
            $this->mainLocationCoordinates = include(config_path('map_coordinates.php'));
            Log::info('Loaded ' . count($this->mainLocationCoordinates) . ' coordinates for location matching');
        } else {
            Log::warning('Map coordinates config file not found. Run: php artisan map:seed-coordinates');
        }
    }

    /**
     * Get locationArea from report (for reference only)
     */
    protected function getLocationAreaFromReport($report)
    {
        if (!isset($report->location)) {
            return '';
        }

        $location = $report->location;

        if (is_string($location)) {
            $location = json_decode($location, true);
        }

        if (is_array($location)) {
            return $location['locationArea'] ?? '';
        }

        if (is_object($location) && isset($location->locationArea)) {
            return $location->locationArea;
        }

        return '';
    }

    /**
     * Get address from report
     */
    protected function getAddressFromReport($report)
    {
        if (!isset($report->location)) {
            return '';
        }

        $location = $report->location;

        if (is_string($location)) {
            $location = json_decode($location, true);
        }

        if (is_array($location)) {
            return $location['address'] ?? '';
        }

        if (is_object($location) && isset($location->address)) {
            return $location->address;
        }

        return '';
    }

    /**
     * Get coordinates from report
     */
    protected function getReportCoordinates($report)
    {
        if (!isset($report->location)) {
            return null;
        }

        $location = $report->location;

        if (is_string($location)) {
            $location = json_decode($location, true);
        }

        if (!is_array($location)) {
            return null;
        }

        // Check for latitude/longitude
        if (isset($location['latitude']) && isset($location['longitude'])
            && is_numeric($location['latitude']) && is_numeric($location['longitude'])
            && $location['latitude'] != 0 && $location['longitude'] != 0) {
            return ['lat' => (float)$location['latitude'], 'lng' => (float)$location['longitude']];
        }

        // Check for lat/lng
        if (isset($location['lat']) && isset($location['lng'])
            && is_numeric($location['lat']) && is_numeric($location['lng'])
            && $location['lat'] != 0 && $location['lng'] != 0) {
            return ['lat' => (float)$location['lat'], 'lng' => (float)$location['lng']];
        }

        return null;
    }

    /**
     * Calculate distance between two points in meters (Haversine formula)
     */
    protected function calculateDistance($lat1, $lng1, $lat2, $lng2)
    {
        $earthRadius = 6371000; // meters

        $latDelta = deg2rad($lat2 - $lat1);
        $lngDelta = deg2rad($lng2 - $lng1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lngDelta / 2) * sin($lngDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Find closest location by proximity using coordinates ONLY
     * This is the PRIMARY method for determining location area
     */
    protected function findClosestLocationByProximity($reportCoords)
    {
        if (!$reportCoords || empty($this->mainLocationCoordinates)) {
            return null;
        }

        $bestMatch = null;
        $bestDistance = PHP_FLOAT_MAX;

        foreach ($this->mainLocationCoordinates as $locationName => $locationCoords) {
            $radius = $this->mainLocations[$locationName]['radius'] ?? 200;

            $distance = $this->calculateDistance(
                $reportCoords['lat'], $reportCoords['lng'],
                $locationCoords['lat'], $locationCoords['lng']
            );

            if ($distance <= $radius && $distance < $bestDistance) {
                $bestDistance = $distance;
                $bestMatch = $locationName;
            }
        }

        if ($bestMatch) {
            Log::info('Location matched by PROXIMITY: ' . $bestMatch . ' (distance: ' . round($bestDistance, 2) . 'm)');
        }

        return $bestMatch;
    }

    /**
     * Get the short key for a location (for frontend filtering)
     */
    protected function getLocationKey($locationName)
    {
        foreach ($this->mainLocations as $fullName => $config) {
            if ($fullName === $locationName) {
                return $config['key'];
            }
        }
        return $locationName;
    }

    /**
     * Determine report location using PROXIMITY FIRST (coordinates)
     * Only use keyword matching if NO coordinates are available
     */
    protected function determineReportLocation($report, $returnKey = true)
    {
        // METHOD 1: Try proximity matching using coordinates (MOST ACCURATE)
        // This is the primary method - coordinates override everything
        $reportCoords = $this->getReportCoordinates($report);
        if ($reportCoords && !empty($this->mainLocationCoordinates)) {
            $matchedLocation = $this->findClosestLocationByProximity($reportCoords);
            if ($matchedLocation) {
                $key = $this->getLocationKey($matchedLocation);
                return $returnKey ? $key : $matchedLocation;
            }
        }

        // METHOD 2: ONLY use keyword matching if NO coordinates are available
        // This is a fallback for reports without coordinates
        $locationArea = $this->getLocationAreaFromReport($report);

        if (!empty($locationArea)) {
            $locationAreaLower = strtolower($locationArea);

            // Check for Mahallahs
            $mahallahs = [
                'asiah' => 'Asiah', 'aminah' => 'Aminah', 'safiyyah' => 'Safiyyah',
                'maryam' => 'Maryam', 'ruqayyah' => 'Ruqayyah', 'ali' => 'Ali',
                'faruq' => 'Faruq', 'bilal' => 'Bilal', 'asma' => 'Asma',
                'hafsah' => 'Hafsah', 'halimah' => 'Halimah', 'siddiq' => 'Siddiq',
                'salahuddin' => 'Salahuddin', 'uthman' => 'Uthman', 'nusaibah' => 'Nusaibah',
                'zubair' => 'Zubair Al-Awwam', 'sumayyah' => 'Sumayyah'
            ];

            foreach ($mahallahs as $keyword => $key) {
                if (strpos($locationAreaLower, $keyword) !== false) {
                    Log::info('Report ' . ($report->reportId ?? 'unknown') . ' matched by KEYWORD (no coordinates): ' . $key);
                    return $returnKey ? $key : 'Mahallah ' . ucfirst($keyword);
                }
            }

            // Check for Kulliyyahs
            $kulliyyahs = [
                'kirkhs' => 'KIRKHS', 'kict' => 'KICT', 'koe' => 'KOE',
                'kaed' => 'KAED', 'kenms' => 'KENMS', 'aikol' => 'AIKOL', 'koed' => 'KOED'
            ];

            foreach ($kulliyyahs as $keyword => $key) {
                if (strpos($locationAreaLower, $keyword) !== false) {
                    Log::info('Report ' . ($report->reportId ?? 'unknown') . ' matched by KEYWORD (no coordinates): ' . $key);
                    return $returnKey ? $key : $key;
                }
            }
        }

        // No match found
        Log::info('Report ' . ($report->reportId ?? 'unknown') . ' has no location match');
        return $returnKey ? null : null;
    }

    /**
     * Get coordinates from emergency
     */
    protected function getEmergencyCoordinates($emergency)
    {
        if (isset($emergency->latitude) && isset($emergency->longitude)
            && is_numeric($emergency->latitude) && is_numeric($emergency->longitude)
            && $emergency->latitude != 0 && $emergency->longitude != 0) {
            return ['lat' => (float)$emergency->latitude, 'lng' => (float)$emergency->longitude];
        }

        $location = $emergency->location;
        if (is_array($location)) {
            if (isset($location['latitude']) && isset($location['longitude'])
                && is_numeric($location['latitude']) && is_numeric($location['longitude'])
                && $location['latitude'] != 0 && $location['longitude'] != 0) {
                return ['lat' => (float)$location['latitude'], 'lng' => (float)$location['longitude']];
            }
        }

        return null;
    }

    /**
     * Determine emergency location using PROXIMITY first
     */
    protected function determineEmergencyLocation($emergency)
    {
        // METHOD 1: Try proximity matching using coordinates (MOST ACCURATE)
        $emergencyCoords = $this->getEmergencyCoordinates($emergency);
        if ($emergencyCoords && !empty($this->mainLocationCoordinates)) {
            $matchedLocation = $this->findClosestLocationByProximity($emergencyCoords);
            if ($matchedLocation) {
                $key = $this->getLocationKey($matchedLocation);
                Log::info('Emergency location matched by PROXIMITY: ' . $key);
                return $key;
            }
        }

        // METHOD 2: Fallback to keyword matching on address (only if no coordinates)
        $address = strtolower($emergency->address ?? '');

        if (!empty($address)) {
            $locationMap = [
                'aminah' => 'Aminah', 'asiah' => 'Asiah', 'safiyyah' => 'Safiyyah',
                'maryam' => 'Maryam', 'ruqayyah' => 'Ruqayyah', 'ali' => 'Ali',
                'faruq' => 'Faruq', 'bilal' => 'Bilal', 'asma' => 'Asma',
                'hafsah' => 'Hafsah', 'halimah' => 'Halimah', 'siddiq' => 'Siddiq',
                'salahuddin' => 'Salahuddin', 'uthman' => 'Uthman', 'nusaibah' => 'Nusaibah',
                'zubair' => 'Zubair Al-Awwam', 'sumayyah' => 'Sumayyah',
                'kirkhs' => 'KIRKHS', 'kict' => 'KICT', 'koe' => 'KOE',
                'kaed' => 'KAED', 'kenms' => 'KENMS', 'aikol' => 'AIKOL', 'koed' => 'KOED',
                'library' => 'Dar al-Hikmah Library', 'stadium' => 'Saidina Hamzah Stadium',
                'mosque' => 'Sultan Haji Ahmad Shah Mosque', 'masjid' => 'Sultan Haji Ahmad Shah Mosque'
            ];

            foreach ($locationMap as $keyword => $locationKey) {
                if (strpos($address, $keyword) !== false) {
                    Log::info('Emergency location matched by KEYWORD (no coordinates): ' . $locationKey);
                    return $locationKey;
                }
            }

            if (preg_match('/mahallah\s+(\w+)/i', $address, $matches)) {
                $found = ucfirst(strtolower($matches[1]));
                Log::info('Emergency location matched by REGEX: ' . $found);
                return $found;
            }
        }

        Log::warning('No location match for emergency - Address: ' . ($emergency->address ?? 'no address'));
        return null;
    }

    /**
     * Get full address string from report
     */
    protected function getFullAddressString($report)
    {
        $addressParts = [];

        if (isset($report->location)) {
            $location = $report->location;

            if (is_string($location)) {
                $location = json_decode($location, true);
            }

            if (is_array($location)) {
                if (!empty($location['locationArea'])) $addressParts[] = $location['locationArea'];
                if (!empty($location['specificPlace'])) $addressParts[] = $location['specificPlace'];
                if (!empty($location['building'])) $addressParts[] = $location['building'];
                if (!empty($location['address'])) $addressParts[] = $location['address'];
            } elseif (is_object($location)) {
                if (!empty($location->locationArea)) $addressParts[] = $location->locationArea;
                if (!empty($location->specificPlace)) $addressParts[] = $location->specificPlace;
                if (!empty($location->building)) $addressParts[] = $location->building;
                if (!empty($location->address)) $addressParts[] = $location->address;
            }
        }

        // Fallback to old fields
        if (empty($addressParts)) {
            if (!empty($report->mahallah)) $addressParts[] = $report->mahallah;
            if (!empty($report->building)) $addressParts[] = $report->building;
            if (!empty($report->address)) $addressParts[] = $report->address;
        }

        // If still empty, try from description (first line only)
        if (empty($addressParts) && !empty($report->description)) {
            $firstLine = explode("\n", $report->description)[0];
            if (strlen($firstLine) < 100) $addressParts[] = $firstLine;
        }

        return implode(', ', array_filter($addressParts));
    }

    /**
     * Group reports by proximity to main locations (for heatmap)
     */
    protected function groupReportsByProximity($reports)
    {
        $grouped = collect();
        $unassigned = [];

        foreach ($reports as $report) {
            $assigned = false;

            // METHOD 1: Try proximity matching using coordinates (PRIMARY)
            $reportCoords = $this->getReportCoordinates($report);
            if ($reportCoords && !empty($this->mainLocationCoordinates)) {
                $bestMatch = null;
                $bestDistance = PHP_FLOAT_MAX;

                foreach ($this->mainLocationCoordinates as $locationName => $locationCoords) {
                    $radius = $this->mainLocations[$locationName]['radius'] ?? 200;

                    $distance = $this->calculateDistance(
                        $reportCoords['lat'], $reportCoords['lng'],
                        $locationCoords['lat'], $locationCoords['lng']
                    );

                    if ($distance <= $radius && $distance < $bestDistance) {
                        $bestDistance = $distance;
                        $bestMatch = $locationName;
                    }
                }

                if ($bestMatch) {
                    if (!isset($grouped[$bestMatch])) {
                        $grouped[$bestMatch] = collect();
                    }
                    $grouped[$bestMatch]->push($report);
                    $assigned = true;
                }
            }

            // METHOD 2: Only use keyword matching if NO coordinates are available
            if (!$assigned) {
                $locationArea = $this->getLocationAreaFromReport($report);
                if (!empty($locationArea)) {
                    $matchedLocation = $this->matchLocationToMainLocation($locationArea);
                    if ($matchedLocation) {
                        if (!isset($grouped[$matchedLocation])) {
                            $grouped[$matchedLocation] = collect();
                        }
                        $grouped[$matchedLocation]->push($report);
                        $assigned = true;
                    }
                }
            }

            if (!$assigned) {
                $unassigned[] = $report;
            }
        }

        if (!empty($unassigned)) {
            $grouped['Unknown'] = collect($unassigned);
        }

        return $grouped;
    }

    /**
     * Match locationArea to main location using keywords (fallback only)
     */
    protected function matchLocationToMainLocation($locationArea)
    {
        if (empty($locationArea)) return null;

        $locationAreaLower = strtolower($locationArea);

        foreach ($this->mainLocations as $mainLocationName => $config) {
            foreach ($config['keywords'] as $keyword) {
                if (strpos($locationAreaLower, strtolower($keyword)) !== false) {
                    return $mainLocationName;
                }
            }
        }

        return null;
    }

    /**
     * Split location into area and specific place/building
     */
    protected function splitLocationIntoAreaAndPlace($report, $inputAddress = null)
    {
        $address = $inputAddress;
        if (!$address) {
            $address = $this->getFullAddressString($report);
        }

        if (empty($address)) {
            return ['locationArea' => null, 'specificPlace' => null, 'building' => null];
        }

        $addressLower = strtolower($address);

        // Predefined specific places (businesses, facilities, etc.)
        $specificPlaces = [
            '7 eleven', '7-eleven', 'seven eleven', 'office', 'cafe', 'cafeteria',
            'restaurant', 'food court', 'gym', 'store', 'shop', 'convenience store'
        ];

        $foundSpecificPlace = null;
        foreach ($specificPlaces as $place) {
            if (strpos($addressLower, $place) !== false) {
                $foundSpecificPlace = $place;
                break;
            }
        }

        // Try to extract building/block/room numbers
        $buildingPattern = '/(block|blk|building|bldg|tower|wing|floor|level|room|rm|suite|unit|no\.|#)\s*([a-z0-9\-]+)/i';
        $foundBuilding = null;
        if (preg_match($buildingPattern, $address, $matches)) {
            $foundBuilding = trim($matches[0]);
        }

        // PRIMARY: Determine location area by proximity (coordinates)
        $locationArea = $this->determineReportLocation($report, false);

        // SECONDARY: If no coordinates, try to extract from address text
        if (!$locationArea) {
            $mahallahs = ['asiah', 'aminah', 'safiyyah', 'maryam', 'ruqayyah', 'ali', 'faruq', 'bilal', 'asma', 'hafsah', 'halimah', 'siddiq', 'salahuddin', 'uthman', 'nusaibah', 'zubair', 'sumayyah'];
            foreach ($mahallahs as $mahallah) {
                if (strpos($addressLower, $mahallah) !== false) {
                    $locationArea = 'Mahallah ' . ucfirst($mahallah);
                    break;
                }
            }

            if (!$locationArea) {
                $kulliyyahs = ['kirkhs' => 'KIRKHS (AHAS KIRKHS)', 'kict' => 'KICT (ICT)', 'koe' => 'KOE (Engineering)', 'kaed' => 'KAED (Architecture)', 'kenms' => 'KENMS (Economics)', 'aikol' => 'AIKOL (Law)', 'koed' => 'KOED (Education)'];
                foreach ($kulliyyahs as $key => $name) {
                    if (strpos($addressLower, $key) !== false) {
                        $locationArea = $name;
                        break;
                    }
                }
            }
        }

        $specificPlace = $foundSpecificPlace;

        if ($foundBuilding && !$specificPlace) {
            $specificPlace = $foundBuilding;
        }

        return [
            'locationArea' => $locationArea,
            'specificPlace' => $specificPlace,
            'building' => $foundBuilding
        ];
    }
}
