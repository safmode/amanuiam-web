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
     * Find closest location by proximity using pre-loaded coordinates
     */
    protected function findClosestLocationByProximity($coords)
    {
        if (!$coords || empty($this->mainLocationCoordinates)) {
            return null;
        }

        $bestMatch = null;
        $bestDistance = PHP_FLOAT_MAX;

        foreach ($this->mainLocationCoordinates as $locationName => $locationCoords) {
            $radius = $this->mainLocations[$locationName]['radius'] ?? 200;

            $distance = $this->calculateDistance(
                $coords['lat'], $coords['lng'],
                $locationCoords['lat'], $locationCoords['lng']
            );

            if ($distance <= $radius && $distance < $bestDistance) {
                $bestDistance = $distance;
                $bestMatch = $locationName;
            }
        }

        return $bestMatch;
    }

    // ============================================
    // EMERGENCY METHODS
    // ============================================

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
     * Determine emergency location using coordinates first, then keywords
     */
    protected function determineEmergencyLocation($emergency)
    {
        // METHOD 1: Try proximity matching using coordinates (MOST ACCURATE)
        $emergencyCoords = $this->getEmergencyCoordinates($emergency);
        if ($emergencyCoords && !empty($this->mainLocationCoordinates)) {
            $matchedLocation = $this->findClosestLocationByProximity($emergencyCoords);
            if ($matchedLocation) {
                $key = $this->getLocationKey($matchedLocation);
                $distance = $this->calculateDistance(
                    $emergencyCoords['lat'], $emergencyCoords['lng'],
                    $this->mainLocationCoordinates[$matchedLocation]['lat'],
                    $this->mainLocationCoordinates[$matchedLocation]['lng']
                );
                Log::info('Emergency location matched by PROXIMITY: ' . $key . ' (distance: ' . round($distance, 2) . 'm)');
                return $key;
            }
        }

        // METHOD 2: Try keyword matching on address (fallback)
        $address = strtolower($emergency->address ?? '');

        if (!empty($address)) {
            $locationMap = [
                'aminah' => 'Aminah',
                'asiah' => 'Asiah',
                'safiyyah' => 'Safiyyah',
                'maryam' => 'Maryam',
                'ruqayyah' => 'Ruqayyah',
                'ali' => 'Ali',
                'faruq' => 'Faruq',
                'bilal' => 'Bilal',
                'asma' => 'Asma',
                'hafsah' => 'Hafsah',
                'halimah' => 'Halimah',
                'siddiq' => 'Siddiq',
                'salahuddin' => 'Salahuddin',
                'uthman' => 'Uthman',
                'nusaibah' => 'Nusaibah',
                'zubair' => 'Zubair Al-Awwam',
                'sumayyah' => 'Sumayyah',
                'kirkhs' => 'KIRKHS',
                'kict' => 'KICT',
                'koe' => 'KOE',
                'kaed' => 'KAED',
                'kenms' => 'KENMS',
                'aikol' => 'AIKOL',
                'koed' => 'KOED',
                'library' => 'Dar al-Hikmah Library',
                'stadium' => 'Saidina Hamzah Stadium',
                'archery' => 'IIUM Archery Range',
                'football' => 'UIA Football Turf',
                'cricket' => 'IIUM Cricket Ground',
                'rugby' => 'IIUM Rugby Field',
                'educare' => 'IIUM Educare',
                'mosque' => 'Sultan Haji Ahmad Shah Mosque',
                'masjid' => 'Sultan Haji Ahmad Shah Mosque',
                'engineering' => 'KOE',
            ];

            foreach ($locationMap as $keyword => $locationKey) {
                if (strpos($address, $keyword) !== false) {
                    Log::info('Emergency location matched by KEYWORD: ' . $locationKey . ' from address: ' . $address);
                    return $locationKey;
                }
            }

            // Try regex for "Mahallah X" pattern
            if (preg_match('/mahallah\s+(\w+)/i', $address, $matches)) {
                $found = ucfirst(strtolower($matches[1]));
                Log::info('Emergency location matched by REGEX: ' . $found);
                return $found;
            }
        }

        Log::warning('No location match for emergency ID: ' . ($emergency->_id ?? 'unknown') . ' Address: ' . ($emergency->address ?? 'no address'));
        return null;
    }

    // ============================================
    // REPORT METHODS (keep your existing ones)
    // ============================================

    /**
     * Determine report location (keep your existing implementation)
     */
    protected function determineReportLocation($report, $returnKey = true)
    {
        // Your existing report location logic here
        // ... keep your existing code ...

        return null;
    }
}
