<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;

trait LocationMatchingTrait
{
    // Define main locations with their keywords and radius
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
        'KIRKHS (AHAS KIRKHS)' => ['keywords' => ['kirkhs', 'kulliyyah of human sciences', 'ahmad ibrahim', 'human sciences'], 'radius' => 150, 'key' => 'KIRKHS'],
        'KICT (ICT)' => ['keywords' => ['kict', 'ict', 'information technology', 'computer science', 'kulliyyah of information', 'iibf', 'islamic banking'], 'radius' => 200, 'key' => 'KICT'],
        'KOE (Engineering)' => ['keywords' => ['koe', 'engineering', 'engineer', 'kulliyyah of engineering'], 'radius' => 150, 'key' => 'KOE'],
        'KAED (Architecture)' => ['keywords' => ['kaed', 'architecture', 'design'], 'radius' => 150, 'key' => 'KAED'],
        'KENMS (Economics)' => ['keywords' => ['kenms', 'economics', 'management', 'business'], 'radius' => 150, 'key' => 'KENMS'],
        'AIKOL (Law)' => ['keywords' => ['aikol', 'law', 'legal'], 'radius' => 150, 'key' => 'AIKOL'],
        'KOED (Education)' => ['keywords' => ['koed', 'education', 'teaching'], 'radius' => 150, 'key' => 'KOED'],

        // Facilities
        'Dar al-Hikmah Library' => ['keywords' => ['library', 'dar al-hikmah', 'perpustakaan'], 'radius' => 100, 'key' => 'Dar al-Hikmah Library'],
        'Female Sports Complex' => ['keywords' => ['female sports', 'sports complex', 'gym', 'women sports'], 'radius' => 150, 'key' => 'Female Sports Complex'],
        'Saidina Hamzah Stadium' => ['keywords' => ['stadium', 'saidina hamzah', 'field'], 'radius' => 200, 'key' => 'Saidina Hamzah Stadium'],
        'IIUM Archery Range' => ['keywords' => ['archery', 'panahan'], 'radius' => 100, 'key' => 'IIUM Archery Range'],
        'UIA Football Turf' => ['keywords' => ['football', 'soccer', 'turf'], 'radius' => 120, 'key' => 'UIA Football Turf'],
        'IIUM Cricket Ground' => ['keywords' => ['cricket', 'ground'], 'radius' => 150, 'key' => 'IIUM Cricket Ground'],
        'IIUM Rugby Field' => ['keywords' => ['rugby', 'field'], 'radius' => 150, 'key' => 'IIUM Rugby Field'],
        'Padang Kawad UIAM' => ['keywords' => ['padang kawad', 'parade', 'kawad'], 'radius' => 150, 'key' => 'Padang Kawad UIAM'],
        'IIUM Educare' => ['keywords' => ['educare', 'kindergarten', 'preschool', 'taska'], 'radius' => 100, 'key' => 'IIUM Educare'],
        'Sultan Haji Ahmad Shah Mosque' => ['keywords' => ['mosque', 'masjid', 'sultan haji ahmad shah', 'prayer hall', 'surau'], 'radius' => 150, 'key' => 'Sultan Haji Ahmad Shah Mosque'],
    ];

    // Pre-loaded coordinates from config
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
     * Get locationArea from report
     */
    protected function getLocationAreaFromReport($report)
    {
        $location = $report->location;

        if (is_array($location)) {
            return $location['locationArea'] ?? '';
        }

        if (is_object($location) && isset($location->locationArea)) {
            return $location->locationArea;
        }

        if (isset($report->locationArea)) {
            return $report->locationArea;
        }

        return '';
    }

    /**
     * Get address from report
     */
    protected function getAddressFromReport($report)
    {
        $location = $report->location;

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
        $location = $report->location;

        if (is_array($location)) {
            if (isset($location['latitude']) && isset($location['longitude'])
                && is_numeric($location['latitude']) && is_numeric($location['longitude'])
                && $location['latitude'] != 0 && $location['longitude'] != 0) {
                return ['lat' => (float)$location['latitude'], 'lng' => (float)$location['longitude']];
            }

            if (isset($location['lat']) && isset($location['lng'])
                && is_numeric($location['lat']) && is_numeric($location['lng'])
                && $location['lat'] != 0 && $location['lng'] != 0) {
                return ['lat' => (float)$location['lat'], 'lng' => (float)$location['lng']];
            }
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
     * Match locationArea to main location using keywords
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
     * Find closest location by proximity
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

        // If not found, return the original
        return $locationName;
    }

    /**
     * Determine report location using keyword matching first, then proximity
     */
    protected function determineReportLocation($report, $returnKey = true)
    {
        // METHOD 1: Try keyword matching using locationArea
        $locationArea = $this->getLocationAreaFromReport($report);
        if (!empty($locationArea)) {
            $matchedLocation = $this->matchLocationToMainLocation($locationArea);
            if ($matchedLocation) {
                return $returnKey ? $this->getLocationKey($matchedLocation) : $matchedLocation;
            }
        }

        // METHOD 2: Try proximity matching using actual coordinates
        $reportCoords = $this->getReportCoordinates($report);
        if ($reportCoords) {
            $matchedLocation = $this->findClosestLocationByProximity($reportCoords);
            if ($matchedLocation) {
                return $returnKey ? $this->getLocationKey($matchedLocation) : $matchedLocation;
            }
        }

        // METHOD 3: Try matching by description/address
        $description = $report->description ?? '';
        $address = $this->getAddressFromReport($report);
        $searchText = strtolower($description . ' ' . $address);

        foreach ($this->mainLocations as $locationName => $config) {
            foreach ($config['keywords'] as $keyword) {
                if (strpos($searchText, strtolower($keyword)) !== false) {
                    return $returnKey ? $this->getLocationKey($locationName) : $locationName;
                }
            }
        }

        // Fallback: return the original locationArea
        return !empty($locationArea) ? ($returnKey ? $locationArea : $locationArea) : null;
    }

    // ============ EMERGENCY METHODS (ADD THESE) ============

    /**
     * Get locationArea from emergency
     */
    protected function getLocationAreaFromEmergency($emergency)
    {
        $location = $emergency->location;

        if (is_array($location)) {
            return $location['locationArea'] ?? '';
        }

        if (is_object($location) && isset($location->locationArea)) {
            return $location->locationArea;
        }

        // Check mahallah field
        if (isset($emergency->mahallah)) {
            return $emergency->mahallah;
        }

        return '';
    }

    /**
     * Get coordinates from emergency
     */
    protected function getEmergencyCoordinates($emergency)
    {
        // Check direct latitude/longitude fields (emergencies have these)
        if (isset($emergency->latitude) && isset($emergency->longitude)
            && is_numeric($emergency->latitude) && is_numeric($emergency->longitude)
            && $emergency->latitude != 0 && $emergency->longitude != 0) {
            return ['lat' => (float)$emergency->latitude, 'lng' => (float)$emergency->longitude];
        }

        // Check nested location object
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
     * Determine emergency location using keyword matching first, then proximity
     */
    protected function determineEmergencyLocation($emergency)
    {
        // METHOD 1: Check address field directly
        $address = strtolower($emergency->address ?? '');
        if (!empty($address)) {
            foreach ($this->mainLocations as $locationName => $config) {
                foreach ($config['keywords'] as $keyword) {
                    if (strpos($address, strtolower($keyword)) !== false) {
                        Log::info('Location matched by address: ' . $config['key'] . ' from address: ' . $address);
                        return $config['key'];
                    }
                }
            }
        }

        // METHOD 2: Check location array
        $location = $emergency->location;
        if (is_array($location)) {
            $mahallah = strtolower($location['mahallah'] ?? '');
            $building = strtolower($location['building'] ?? '');
            $locationArea = strtolower($location['locationArea'] ?? '');
            $searchText = $mahallah . ' ' . $building . ' ' . $locationArea;

            if (!empty($searchText)) {
                foreach ($this->mainLocations as $locationName => $config) {
                    foreach ($config['keywords'] as $keyword) {
                        if (strpos($searchText, strtolower($keyword)) !== false) {
                            Log::info('Location matched by location array: ' . $config['key'] . ' from: ' . $searchText);
                            return $config['key'];
                        }
                    }
                }
            }
        }

        // METHOD 3: Check if address contains any mahallah name
        $mahallahNames = ['asiah', 'aminah', 'safiyyah', 'maryam', 'ruqayyah', 'ali', 'faruq', 'bilal', 'asma', 'hafsah', 'halimah', 'siddiq', 'salahuddin', 'uthman', 'nusaibah', 'zubair', 'sumayyah'];

        foreach ($mahallahNames as $mahallah) {
            if (strpos($address, $mahallah) !== false) {
                // Find the matching key
                foreach ($this->mainLocations as $locationName => $config) {
                    if (strpos($locationName, strtolower($mahallah)) !== false || strpos(strtolower($config['key']), $mahallah) !== false) {
                        Log::info('Location matched by mahallah name: ' . $config['key']);
                        return $config['key'];
                    }
                }
            }
        }

        // METHOD 4: Try to extract from address - look for "Mahallah X"
        if (preg_match('/mahallah\s+(\w+)/i', $address, $matches)) {
            $foundMahallah = strtolower($matches[1]);
            foreach ($this->mainLocations as $locationName => $config) {
                if (strpos(strtolower($config['key']), $foundMahallah) !== false) {
                    Log::info('Location matched by regex: ' . $config['key']);
                    return $config['key'];
                }
            }
        }

        Log::warning('No location match found for emergency: ' . ($emergency->_id ?? 'unknown') . ' Address: ' . ($emergency->address ?? 'no address'));
        return null;
    }
}
