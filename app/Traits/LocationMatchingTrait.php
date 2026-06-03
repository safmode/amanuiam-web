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
     * Get the specific address (building, room, etc.)
     */
    protected function getSpecificAddressFromReport($report)
    {
        if (!isset($report->location)) {
            return '';
        }

        $location = $report->location;

        if (is_string($location)) {
            $location = json_decode($location, true);
        }

        if (is_array($location)) {
            if (!empty($location['specificPlace'])) {
                return $location['specificPlace'];
            }
            if (!empty($location['building'])) {
                return $location['building'];
            }
        }

        return '';
    }

    /**
     * Calculate distance between two points in meters
     */
    protected function calculateDistance($lat1, $lng1, $lat2, $lng2)
    {
        $earthRadius = 6371000;
        $latDelta = deg2rad($lat2 - $lat1);
        $lngDelta = deg2rad($lng2 - $lng1);
        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lngDelta / 2) * sin($lngDelta / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }

    /**
     * Find the nearest location by coordinates (always returns something if coordinates exist)
     */
    protected function findNearestLocationByProximity($reportCoords)
    {
        if (!$reportCoords || empty($this->mainLocationCoordinates)) {
            return null;
        }

        $bestMatch = null;
        $bestDistance = PHP_FLOAT_MAX;

        foreach ($this->mainLocationCoordinates as $locationName => $locationCoords) {
            $distance = $this->calculateDistance(
                $reportCoords['lat'], $reportCoords['lng'],
                $locationCoords['lat'], $locationCoords['lng']
            );

            if ($distance < $bestDistance) {
                $bestDistance = $distance;
                $bestMatch = $locationName;
            }
        }

        if ($bestMatch) {
            Log::info('Nearest location found: ' . $bestMatch . ' (distance: ' . round($bestDistance, 2) . 'm)');
        }

        return $bestMatch;
    }

    /**
     * Extract location name from text using keywords
     * Returns the matching location display name or null
     */
    protected function extractLocationFromText($text)
    {
        if (empty($text)) return null;

        $textLower = strtolower($text);

        foreach ($this->mainLocations as $locationName => $config) {
            foreach ($config['keywords'] as $keyword) {
                if (strpos($textLower, strtolower($keyword)) !== false) {
                    Log::info('Text matched location: ' . $config['display'] . ' (keyword: ' . $keyword . ')');
                    return [
                        'location' => $locationName,
                        'display' => $config['display'],
                        'key' => $config['key']
                    ];
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
     * Determine report location - FOLLOWS YOUR REQUIREMENTS:
     * 1. If manually set by admin (from dropdown), use that
     * 2. Otherwise, check address text for location name (e.g., "Ruqayyah" -> Mahallah Ruqayyah)
     * 3. If no text match, use coordinates to find nearest location
     * 4. Location Area is NEVER null (always finds something)
     */
    protected function determineReportLocation($report, $returnKey = true)
    {
        // STEP 1: Check if locationArea is already manually set by admin
        // For manual reports, admin selects from dropdown, so this is used
        $existingLocationArea = $this->getLocationAreaFromReport($report);
        if (!empty($existingLocationArea)) {
            // Check if it's a valid predefined location
            $locationAreaLower = strtolower($existingLocationArea);
            foreach ($this->mainLocations as $locationName => $config) {
                if (strtolower($config['display']) === $locationAreaLower ||
                    strtolower($config['key']) === $locationAreaLower ||
                    $locationAreaLower === strtolower($locationName)) {
                    Log::info('Report ' . ($report->reportId ?? 'unknown') . ' using manually set location: ' . $locationName);
                    return $returnKey ? $this->getLocationKey($locationName) : $locationName;
                }
            }
        }

        // STEP 2: Try to extract location from address text (e.g., "Co-Mart Ruqayyah" -> Mahallah Ruqayyah)
        $addressText = $this->getFullAddressString($report);
        if (!empty($addressText)) {
            $matched = $this->extractLocationFromText($addressText);
            if ($matched) {
                Log::info('Report ' . ($report->reportId ?? 'unknown') . ' matched by TEXT: ' . $matched['display']);
                return $returnKey ? $matched['key'] : $matched['location'];
            }
        }

        // STEP 3: Try extracting from description if address is empty
        if (empty($addressText) && !empty($report->description)) {
            $matched = $this->extractLocationFromText($report->description);
            if ($matched) {
                Log::info('Report ' . ($report->reportId ?? 'unknown') . ' matched by DESCRIPTION: ' . $matched['display']);
                return $returnKey ? $matched['key'] : $matched['location'];
            }
        }

        // STEP 4: Use coordinates to find the nearest location
        // For mobile reports with coordinates, this will find the closest Mahallah/Kulliyyah
        $reportCoords = $this->getReportCoordinates($report);
        if ($reportCoords && !empty($this->mainLocationCoordinates)) {
            $nearestLocation = $this->findNearestLocationByProximity($reportCoords);
            if ($nearestLocation) {
                $key = $this->getLocationKey($nearestLocation);
                $display = $this->getLocationDisplayName($nearestLocation);
                Log::info('Report ' . ($report->reportId ?? 'unknown') . ' matched by NEAREST location: ' . $display);
                return $returnKey ? $key : $nearestLocation;
            }
        }

        // STEP 5: LAST RESORT - If everything fails, return the first location in the list
        // This ensures Location Area is NEVER null
        $firstLocation = array_key_first($this->mainLocations);
        Log::warning('Report ' . ($report->reportId ?? 'unknown') . ' using fallback location: ' . $firstLocation);
        return $returnKey ? $this->getLocationKey($firstLocation) : $firstLocation;
    }

    /**
     * Get the original location text for Specific Address column
     * This extracts everything except the matched location name from the address
     */
    protected function getOriginalLocationText($report)
    {
        $location = $report->location;
        $fullText = '';

        if (is_string($location)) {
            $location = json_decode($location, true);
        }

        if (is_array($location)) {
            // Priority order for Specific Address:
            // 1. specificPlace (if already set)
            // 2. building (if already set)
            // 3. address - extract from here

            if (!empty($location['specificPlace'])) {
                return $location['specificPlace'];
            }

            if (!empty($location['building'])) {
                return $location['building'];
            }

            if (!empty($location['address'])) {
                $fullText = $location['address'];
            }
        }

        // Fallback to report fields
        if (empty($fullText) && !empty($report->specificPlace)) {
            return $report->specificPlace;
        }
        if (empty($fullText) && !empty($report->building)) {
            return $report->building;
        }
        if (empty($fullText) && !empty($report->address)) {
            $fullText = $report->address;
        }

        // Find the matched location to remove it
        $matchedLocation = $this->determineReportLocation($report, false);
        if ($matchedLocation && !empty($fullText)) {
            $displayName = $this->getLocationDisplayName($matchedLocation);
            $shortKey = $this->getLocationKey($matchedLocation);

            // Remove the location name and keep everything else
            $fullText = str_ireplace($displayName, '', $fullText);
            $fullText = str_ireplace($shortKey, '', $fullText);
            $fullText = str_ireplace($matchedLocation, '', $fullText);
            $fullText = str_ireplace('Mahallah ', '', $fullText);
            $fullText = str_ireplace('Kulliyyah ', '', $fullText);

            // Clean up
            $fullText = preg_replace('/\s+/', ' ', $fullText);
            $fullText = trim($fullText, ' ,');
        }

        // If still empty, return the original address (fallback)
        if (empty($fullText) && !empty($location['address'])) {
            $fullText = $location['address'];
        }

        return !empty($fullText) ? $fullText : 'Not specified';
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
                }
                if (!empty($location['building'])) {
                    $addressParts[] = $location['building'];
                }
                if (!empty($location['specificPlace'])) {
                    $addressParts[] = $location['specificPlace'];
                }
                if (!empty($location['locationArea'])) {
                    $addressParts[] = $location['locationArea'];
                }
            }
        }

        if (empty($addressParts)) {
            if (!empty($report->building)) {
                $addressParts[] = $report->building;
            }
            if (!empty($report->address)) {
                $addressParts[] = $report->address;
            }
            if (!empty($report->mahallah)) {
                $addressParts[] = $report->mahallah;
            }
        }

        return !empty($addressParts) ? implode(', ', $addressParts) : '';
    }

    /**
     * Split location into area and specific place
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

        $matched = $this->extractLocationFromText($address);

        if ($matched) {
            $specificAddress = trim(str_ireplace($matched['display'], '', $address));
            $specificAddress = trim(str_ireplace($matched['key'], '', $specificAddress));
            $specificAddress = preg_replace('/\s+/', ' ', $specificAddress);
            $specificAddress = trim($specificAddress, ' ,');

            return [
                'locationArea' => $matched['display'],
                'specificPlace' => !empty($specificAddress) ? $specificAddress : null,
                'building' => null
            ];
        }

        return [
            'locationArea' => null,
            'specificPlace' => $address,
            'building' => null
        ];
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
            $nearestLocation = $this->findNearestLocationByProximity($emergencyCoords);
            if ($nearestLocation) {
                return $this->getLocationKey($nearestLocation);
            }
        }
        return null;
    }
}
