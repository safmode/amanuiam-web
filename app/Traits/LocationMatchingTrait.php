<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;

trait LocationMatchingTrait
{
    private $mainLocations = [
        // Mahallahs
        'Mahallah Asiah' => ['keywords' => ['asiah', 'mahallah asiah'], 'radius' => 200, 'key' => 'Asiah', 'display' => 'Mahallah Asiah'],
        'Mahallah Aminah' => ['keywords' => ['aminah', 'mahallah aminah'], 'radius' => 200, 'key' => 'Aminah', 'display' => 'Mahallah Aminah'],
        'Mahallah Safiyyah' => ['keywords' => ['safiyyah', 'mahallah safiyyah'], 'radius' => 200, 'key' => 'Safiyyah', 'display' => 'Mahallah Safiyyah'],
        'Mahallah Maryam' => ['keywords' => ['maryam', 'mahallah maryam'], 'radius' => 200, 'key' => 'Maryam', 'display' => 'Mahallah Maryam'],
        'Mahallah Ruqayyah' => ['keywords' => ['ruqayyah', 'mahallah ruqayyah'], 'radius' => 200, 'key' => 'Ruqayyah', 'display' => 'Mahallah Ruqayyah'],
        'Mahallah Ali' => ['keywords' => ['ali', 'mahallah ali'], 'radius' => 200, 'key' => 'Ali', 'display' => 'Mahallah Ali'],
        'Mahallah Faruq' => ['keywords' => ['faruq', 'mahallah faruq'], 'radius' => 200, 'key' => 'Faruq', 'display' => 'Mahallah Faruq'],
        'Mahallah Bilal' => ['keywords' => ['bilal', 'mahallah bilal'], 'radius' => 200, 'key' => 'Bilal', 'display' => 'Mahallah Bilal'],
        'Mahallah Asma' => ['keywords' => ['asma', 'mahallah asma'], 'radius' => 200, 'key' => 'Asma', 'display' => 'Mahallah Asma'],
        'Mahallah Hafsah' => ['keywords' => ['hafsah', 'mahallah hafsah'], 'radius' => 200, 'key' => 'Hafsah', 'display' => 'Mahallah Hafsah'],
        'Mahallah Halimah' => ['keywords' => ['halimah', 'mahallah halimah'], 'radius' => 200, 'key' => 'Halimah', 'display' => 'Mahallah Halimah'],
        'Mahallah Siddiq' => ['keywords' => ['siddiq', 'mahallah siddiq'], 'radius' => 200, 'key' => 'Siddiq', 'display' => 'Mahallah Siddiq'],
        'Mahallah Salahuddin' => ['keywords' => ['salahuddin', 'mahallah salahuddin'], 'radius' => 200, 'key' => 'Salahuddin', 'display' => 'Mahallah Salahuddin'],
        'Mahallah Uthman' => ['keywords' => ['uthman', 'mahallah uthman'], 'radius' => 200, 'key' => 'Uthman', 'display' => 'Mahallah Uthman'],
        'Mahallah Nusaibah' => ['keywords' => ['nusaibah', 'mahallah nusaibah'], 'radius' => 200, 'key' => 'Nusaibah', 'display' => 'Mahallah Nusaibah'],
        'Mahallah Zubair Al-Awwam' => ['keywords' => ['zubair', 'mahallah zubair'], 'radius' => 200, 'key' => 'Zubair Al-Awwam', 'display' => 'Mahallah Zubair'],
        'Mahallah Sumayyah' => ['keywords' => ['sumayyah', 'mahallah sumayyah'], 'radius' => 200, 'key' => 'Sumayyah', 'display' => 'Mahallah Sumayyah'],

        // Kulliyyahs
        'KIRKHS (AHAS KIRKHS)' => ['keywords' => ['kirkhs', 'kulliyyah of human sciences', 'human sciences'], 'radius' => 150, 'key' => 'KIRKHS', 'display' => 'KIRKHS (AHAS KIRKHS)'],
        'KICT (ICT)' => ['keywords' => ['kict', 'ict', 'information technology', 'iibf', 'islamic banking'], 'radius' => 200, 'key' => 'KICT', 'display' => 'KICT (ICT)'],
        'KOE (Engineering)' => ['keywords' => ['koe', 'engineering'], 'radius' => 150, 'key' => 'KOE', 'display' => 'KOE (Engineering)'],
        'KAED (Architecture)' => ['keywords' => ['kaed', 'architecture'], 'radius' => 150, 'key' => 'KAED', 'display' => 'KAED (Architecture)'],
        'KENMS (Economics)' => ['keywords' => ['kenms', 'economics'], 'radius' => 150, 'key' => 'KENMS', 'display' => 'KENMS (Economics)'],
        'AIKOL (Law)' => ['keywords' => ['aikol', 'law'], 'radius' => 150, 'key' => 'AIKOL', 'display' => 'AIKOL (Law)'],
        'KOED (Education)' => ['keywords' => ['koed', 'education'], 'radius' => 150, 'key' => 'KOED', 'display' => 'KOED (Education)'],

        // Facilities
        'Dar al-Hikmah Library' => ['keywords' => ['library', 'dar al-hikmah'], 'radius' => 100, 'key' => 'Dar al-Hikmah Library', 'display' => 'Dar al-Hikmah Library'],
        'Female Sports Complex' => ['keywords' => ['female sports', 'sports complex', 'gym'], 'radius' => 150, 'key' => 'Female Sports Complex', 'display' => 'Female Sports Complex'],
        'Saidina Hamzah Stadium' => ['keywords' => ['stadium', 'saidina hamzah'], 'radius' => 200, 'key' => 'Saidina Hamzah Stadium', 'display' => 'Saidina Hamzah Stadium'],
        'IIUM Archery Range' => ['keywords' => ['archery', 'panahan'], 'radius' => 100, 'key' => 'IIUM Archery Range', 'display' => 'IIUM Archery Range'],
        'UIA Football Turf' => ['keywords' => ['football', 'soccer', 'turf'], 'radius' => 120, 'key' => 'UIA Football Turf', 'display' => 'UIA Football Turf'],
        'IIUM Cricket Ground' => ['keywords' => ['cricket', 'ground'], 'radius' => 150, 'key' => 'IIUM Cricket Ground', 'display' => 'IIUM Cricket Ground'],
        'IIUM Rugby Field' => ['keywords' => ['rugby', 'field'], 'radius' => 150, 'key' => 'IIUM Rugby Field', 'display' => 'IIUM Rugby Field'],
        'Padang Kawad UIAM' => ['keywords' => ['padang kawad', 'parade'], 'radius' => 150, 'key' => 'Padang Kawad UIAM', 'display' => 'Padang Kawad UIAM'],
        'IIUM Educare' => ['keywords' => ['educare', 'kindergarten'], 'radius' => 100, 'key' => 'IIUM Educare', 'display' => 'IIUM Educare'],
        'Sultan Haji Ahmad Shah Mosque' => ['keywords' => ['mosque', 'masjid'], 'radius' => 150, 'key' => 'Sultan Haji Ahmad Shah Mosque', 'display' => 'Sultan Haji Ahmad Shah Mosque'],
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
     * Get locationArea from report
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
     * Find closest location by proximity using coordinates
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
     * Match locationArea to main location using keywords (only against predefined list)
     */
    protected function matchLocationToMainLocation($locationArea)
    {
        if (empty($locationArea)) return null;

        $locationAreaLower = strtolower($locationArea);

        foreach ($this->mainLocations as $mainLocationName => $config) {
            foreach ($config['keywords'] as $keyword) {
                if (strpos($locationAreaLower, strtolower($keyword)) !== false) {
                    Log::info('Location matched by KEYWORD: ' . $mainLocationName . ' (keyword: ' . $keyword . ')');
                    return $mainLocationName;
                }
            }
        }

        return null;
    }

    /**
     * Get the display name for a location
     */
    protected function getLocationDisplayName($locationName)
    {
        foreach ($this->mainLocations as $fullName => $config) {
            if ($fullName === $locationName) {
                return $config['display'];
            }
        }
        return $locationName;
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
     * Determine report location - HYBRID APPROACH
     * Priority: 1. Manually set locationArea, 2. Coordinates proximity, 3. Keyword matching
     */
    protected function determineReportLocation($report, $returnKey = true)
    {
        // METHOD 1: Check if locationArea is already manually set (admin created)
        $existingLocationArea = $this->getLocationAreaFromReport($report);
        if (!empty($existingLocationArea)) {
            // Check if it's already a valid predefined location
            $matched = $this->matchLocationToMainLocation($existingLocationArea);
            if ($matched) {
                Log::info('Report ' . ($report->reportId ?? 'unknown') . ' using manually set location: ' . $matched);
                return $returnKey ? $this->getLocationKey($matched) : $matched;
            }
        }

        // METHOD 2: Try proximity matching using coordinates (for mobile reports)
        $reportCoords = $this->getReportCoordinates($report);
        if ($reportCoords && !empty($this->mainLocationCoordinates)) {
            $matchedLocation = $this->findClosestLocationByProximity($reportCoords);
            if ($matchedLocation) {
                $key = $this->getLocationKey($matchedLocation);
                Log::info('Report ' . ($report->reportId ?? 'unknown') . ' matched by PROXIMITY: ' . $key);
                return $returnKey ? $key : $matchedLocation;
            }
        }

        // METHOD 3: Fallback to keyword matching (for legacy data)
        if (!empty($existingLocationArea)) {
            $matched = $this->matchLocationToMainLocation($existingLocationArea);
            if ($matched) {
                Log::info('Report ' . ($report->reportId ?? 'unknown') . ' matched by KEYWORD: ' . $matched);
                return $returnKey ? $this->getLocationKey($matched) : $matched;
            }
        }

        // No match found
        Log::info('Report ' . ($report->reportId ?? 'unknown') . ' has no location match');
        return $returnKey ? null : null;
    }

    /**
     * Get the original location text (for Specific Address column)
     */
    protected function getOriginalLocationText($report)
    {
        $location = $report->location;

        if (is_string($location)) {
            $location = json_decode($location, true);
        }

        if (is_array($location)) {
            if (!empty($location['address'])) {
                return $location['address'];
            }
            if (!empty($location['locationArea'])) {
                return $location['locationArea'];
            }
        }

        return '';
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
                if (!empty($location['address'])) {
                    $addressParts[] = $location['address'];
                } elseif (!empty($location['locationArea'])) {
                    $addressParts[] = $location['locationArea'];
                }
                if (!empty($location['building'])) {
                    $addressParts[] = $location['building'];
                }
                if (!empty($location['specificPlace'])) {
                    $addressParts[] = $location['specificPlace'];
                }
            }
        }

        return !empty($addressParts) ? implode(', ', $addressParts) : '';
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

            // Check manually set location first
            $locationArea = $this->getLocationAreaFromReport($report);
            if (!empty($locationArea)) {
                $matched = $this->matchLocationToMainLocation($locationArea);
                if ($matched) {
                    if (!isset($grouped[$matched])) {
                        $grouped[$matched] = collect();
                    }
                    $grouped[$matched]->push($report);
                    $assigned = true;
                }
            }

            // If not manually set, try proximity
            if (!$assigned) {
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
     * Determine emergency location
     */
    protected function determineEmergencyLocation($emergency)
    {
        $emergencyCoords = $this->getEmergencyCoordinates($emergency);
        if ($emergencyCoords && !empty($this->mainLocationCoordinates)) {
            $matchedLocation = $this->findClosestLocationByProximity($emergencyCoords);
            if ($matchedLocation) {
                return $this->getLocationKey($matchedLocation);
            }
        }
        return null;
    }
}
