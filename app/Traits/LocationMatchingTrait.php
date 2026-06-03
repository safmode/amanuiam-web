<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;

trait LocationMatchingTrait
{
    private $mainLocations = [
        // Mahallahs
        'Mahallah Asiah' => ['keywords' => ['asiah', 'mahallah asiah'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Asiah', 'display' => 'Mahallah Asiah'],
        'Mahallah Aminah' => ['keywords' => ['aminah', 'mahallah aminah'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Aminah', 'display' => 'Mahallah Aminah'],
        'Mahallah Safiyyah' => ['keywords' => ['safiyyah', 'mahallah safiyyah'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Safiyyah', 'display' => 'Mahallah Safiyyah'],
        'Mahallah Maryam' => ['keywords' => ['maryam', 'mahallah maryam'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Maryam', 'display' => 'Mahallah Maryam'],
        'Mahallah Ruqayyah' => ['keywords' => ['ruqayyah', 'mahallah ruqayyah'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Ruqayyah', 'display' => 'Mahallah Ruqayyah'],
        'Mahallah Ali' => ['keywords' => ['ali', 'mahallah ali'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Ali', 'display' => 'Mahallah Ali'],
        'Mahallah Faruq' => ['keywords' => ['faruq', 'mahallah faruq'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Faruq', 'display' => 'Mahallah Faruq'],
        'Mahallah Bilal' => ['keywords' => ['bilal', 'mahallah bilal'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Bilal', 'display' => 'Mahallah Bilal'],
        'Mahallah Asma' => ['keywords' => ['asma', 'mahallah asma'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Asma', 'display' => 'Mahallah Asma'],
        'Mahallah Hafsah' => ['keywords' => ['hafsah', 'mahallah hafsah'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Hafsah', 'display' => 'Mahallah Hafsah'],
        'Mahallah Halimah' => ['keywords' => ['halimah', 'mahallah halimah'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Halimah', 'display' => 'Mahallah Halimah'],
        'Mahallah Siddiq' => ['keywords' => ['siddiq', 'mahallah siddiq'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Siddiq', 'display' => 'Mahallah Siddiq'],
        'Mahallah Salahuddin' => ['keywords' => ['salahuddin', 'mahallah salahuddin'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Salahuddin', 'display' => 'Mahallah Salahuddin'],
        'Mahallah Uthman' => ['keywords' => ['uthman', 'mahallah uthman'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Uthman', 'display' => 'Mahallah Uthman'],
        'Mahallah Nusaibah' => ['keywords' => ['nusaibah', 'mahallah nusaibah'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Nusaibah', 'display' => 'Mahallah Nusaibah'],
        'Mahallah Zubair Al-Awwam' => ['keywords' => ['zubair', 'mahallah zubair'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Zubair Al-Awwam', 'display' => 'Mahallah Zubair'],
        'Mahallah Sumayyah' => ['keywords' => ['sumayyah', 'mahallah sumayyah'], 'proximity_radius' => 200, 'map_radius' => 300, 'key' => 'Sumayyah', 'display' => 'Mahallah Sumayyah'],

        // Kulliyyahs
        'KIRKHS (AHAS KIRKHS)' => ['keywords' => ['kirkhs', 'kulliyyah of human sciences', 'human sciences'], 'proximity_radius' => 150, 'map_radius' => 250, 'key' => 'KIRKHS', 'display' => 'KIRKHS (AHAS KIRKHS)'],
        'KICT (ICT)' => ['keywords' => ['kict', 'ict', 'information technology', 'iibf', 'islamic banking'], 'proximity_radius' => 150, 'map_radius' => 300, 'key' => 'KICT', 'display' => 'KICT (ICT)'],
        'KOE (Engineering)' => ['keywords' => ['koe', 'engineering'], 'proximity_radius' => 150, 'map_radius' => 250, 'key' => 'KOE', 'display' => 'KOE (Engineering)'],
        'KAED (Architecture)' => ['keywords' => ['kaed', 'architecture'], 'proximity_radius' => 150, 'map_radius' => 250, 'key' => 'KAED', 'display' => 'KAED (Architecture)'],
        'KENMS (Economics)' => ['keywords' => ['kenms', 'economics'], 'proximity_radius' => 150, 'map_radius' => 250, 'key' => 'KENMS', 'display' => 'KENMS (Economics)'],
        'AIKOL (Law)' => ['keywords' => ['aikol', 'law'], 'proximity_radius' => 150, 'map_radius' => 250, 'key' => 'AIKOL', 'display' => 'AIKOL (Law)'],
        'KOED (Education)' => ['keywords' => ['koed', 'education'], 'proximity_radius' => 150, 'map_radius' => 250, 'key' => 'KOED', 'display' => 'KOED (Education)'],

        // Facilities
        'Dar al-Hikmah Library' => ['keywords' => ['library', 'dar al-hikmah'], 'proximity_radius' => 100, 'map_radius' => 200, 'key' => 'Dar al-Hikmah Library', 'display' => 'Dar al-Hikmah Library'],
        'Female Sports Complex' => ['keywords' => ['female sports', 'sports complex', 'gym'], 'proximity_radius' => 120, 'map_radius' => 250, 'key' => 'Female Sports Complex', 'display' => 'Female Sports Complex'],
        'Saidina Hamzah Stadium' => ['keywords' => ['stadium', 'saidina hamzah'], 'proximity_radius' => 150, 'map_radius' => 300, 'key' => 'Saidina Hamzah Stadium', 'display' => 'Saidina Hamzah Stadium'],
        'IIUM Archery Range' => ['keywords' => ['archery', 'panahan'], 'proximity_radius' => 100, 'map_radius' => 200, 'key' => 'IIUM Archery Range', 'display' => 'IIUM Archery Range'],
        'UIA Football Turf' => ['keywords' => ['football', 'soccer', 'turf'], 'proximity_radius' => 120, 'map_radius' => 250, 'key' => 'UIA Football Turf', 'display' => 'UIA Football Turf'],
        'IIUM Cricket Ground' => ['keywords' => ['cricket', 'ground'], 'proximity_radius' => 120, 'map_radius' => 250, 'key' => 'IIUM Cricket Ground', 'display' => 'IIUM Cricket Ground'],
        'IIUM Rugby Field' => ['keywords' => ['rugby', 'field'], 'proximity_radius' => 120, 'map_radius' => 250, 'key' => 'IIUM Rugby Field', 'display' => 'IIUM Rugby Field'],
        'Padang Kawad UIAM' => ['keywords' => ['padang kawad', 'parade'], 'proximity_radius' => 120, 'map_radius' => 250, 'key' => 'Padang Kawad UIAM', 'display' => 'Padang Kawad UIAM'],
        'IIUM Educare' => ['keywords' => ['educare', 'kindergarten'], 'proximity_radius' => 100, 'map_radius' => 200, 'key' => 'IIUM Educare', 'display' => 'IIUM Educare'],
        'Sultan Haji Ahmad Shah Mosque' => ['keywords' => ['mosque', 'masjid'], 'proximity_radius' => 120, 'map_radius' => 250, 'key' => 'Sultan Haji Ahmad Shah Mosque', 'display' => 'Sultan Haji Ahmad Shah Mosque'],
    ];

    private $mainLocationCoordinates = [];

    protected function initLocationMatching()
    {
        if (file_exists(config_path('map_coordinates.php'))) {
            $this->mainLocationCoordinates = include(config_path('map_coordinates.php'));
            Log::info('Loaded ' . count($this->mainLocationCoordinates) . ' coordinates for location matching');
        } else {
            Log::warning('Map coordinates config file not found. Run: php artisan map:seed-coordinates');
        }
    }

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

    protected function getSpecificPlaceFromReport($report)
    {
        if (!isset($report->location)) {
            return '';
        }

        $location = $report->location;

        if (is_string($location)) {
            $location = json_decode($location, true);
        }

        if (is_array($location)) {
            return $location['specificPlace'] ?? '';
        }

        if (is_object($location) && isset($location->specificPlace)) {
            return $location->specificPlace;
        }

        return '';
    }

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

    protected function findClosestLocationByProximity($reportCoords)
    {
        if (!$reportCoords || empty($this->mainLocationCoordinates)) {
            return null;
        }

        $bestMatch = null;
        $bestDistance = PHP_FLOAT_MAX;

        foreach ($this->mainLocationCoordinates as $locationName => $locationCoords) {
            $radius = $this->mainLocations[$locationName]['proximity_radius'] ?? 150;

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
            Log::info('Report matched by PROXIMITY: ' . $bestMatch . ' (distance: ' . round($bestDistance, 2) . 'm)');
        }

        return $bestMatch;
    }

    protected function findClosestLocationForMap($reportCoords)
    {
        if (!$reportCoords || empty($this->mainLocationCoordinates)) {
            return null;
        }

        $bestMatch = null;
        $bestDistance = PHP_FLOAT_MAX;

        foreach ($this->mainLocationCoordinates as $locationName => $locationCoords) {
            $radius = $this->mainLocations[$locationName]['map_radius'] ?? 250;

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
            Log::info('Map matched by PROXIMITY: ' . $bestMatch . ' (distance: ' . round($bestDistance, 2) . 'm)');
        }

        return $bestMatch;
    }

    protected function matchLocationToMainLocation($locationArea)
    {
        if (empty($locationArea)) return null;

        $locationAreaLower = strtolower($locationArea);

        foreach ($this->mainLocations as $mainLocationName => $config) {
            foreach ($config['keywords'] as $keyword) {
                if (strpos($locationAreaLower, strtolower($keyword)) !== false) {
                    Log::info('Map matched location by KEYWORD: ' . $mainLocationName . ' (keyword: ' . $keyword . ')');
                    return $mainLocationName;
                }
            }
        }

        return null;
    }

    protected function extractLocationFromText($text)
    {
        if (empty($text)) return null;

        $textLower = strtolower($text);

        // ONLY match against your predefined keywords
        foreach ($this->mainLocations as $mainLocationName => $config) {
            foreach ($config['keywords'] as $keyword) {
                if (strpos($textLower, strtolower($keyword)) !== false) {
                    Log::info('Text matched location: ' . $config['display'] . ' (keyword: ' . $keyword . ')');
                    return [
                        'location' => $mainLocationName,
                        'display' => $config['display'],
                        'key' => $config['key']
                    ];
                }
            }
        }

        return null;
    }

    protected function getLocationDisplayName($locationName)
    {
        foreach ($this->mainLocations as $fullName => $config) {
            if ($fullName === $locationName) {
                return $config['display'];
            }
        }
        return $locationName;
    }

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
     * Determine report location - TEXT FIRST, THEN PROXIMITY
     */
    protected function determineReportLocation($report, $returnKey = true)
    {
        // STEP 1: ALWAYS check address text for keywords FIRST
        $addressText = $this->getFullAddressString($report);
        if (!empty($addressText)) {
            $matched = $this->extractLocationFromText($addressText);
            if ($matched) {
                Log::info('Report ' . ($report->reportId ?? 'unknown') . ' matched by TEXT: ' . $matched['display']);
                return $returnKey ? $matched['key'] : $matched['location'];
            }
        }

        // STEP 2: Check description if address is empty
        if (empty($addressText) && !empty($report->description)) {
            $matched = $this->extractLocationFromText($report->description);
            if ($matched) {
                Log::info('Report ' . ($report->reportId ?? 'unknown') . ' matched by DESCRIPTION: ' . $matched['display']);
                return $returnKey ? $matched['key'] : $matched['location'];
            }
        }

        // STEP 3: If no text match, try proximity using coordinates
        $reportCoords = $this->getReportCoordinates($report);
        if ($reportCoords && !empty($this->mainLocationCoordinates)) {
            $matchedLocation = $this->findClosestLocationByProximity($reportCoords);
            if ($matchedLocation) {
                $key = $this->getLocationKey($matchedLocation);
                Log::info('Report ' . ($report->reportId ?? 'unknown') . ' matched by PROXIMITY: ' . $key);
                return $returnKey ? $key : $matchedLocation;
            }
        }

        // STEP 4: Check existing locationArea only if it's a valid predefined location
        $existingLocationArea = $this->getLocationAreaFromReport($report);
        if (!empty($existingLocationArea)) {
            $matched = $this->matchLocationToMainLocation($existingLocationArea);
            if ($matched) {
                Log::info('Report ' . ($report->reportId ?? 'unknown') . ' using existing location: ' . $matched);
                return $returnKey ? $this->getLocationKey($matched) : $matched;
            }
        }

        // No match - Location Area will be empty/not specified
        Log::info('Report ' . ($report->reportId ?? 'unknown') . ' has no location match');
        return $returnKey ? null : null;
    }

    protected function getOriginalLocationText($report)
    {
        $location = $report->location;
        $fullText = '';

        if (is_string($location)) {
            $location = json_decode($location, true);
        }

        if (is_array($location)) {
            $parts = [];

            if (!empty($location['specificPlace'])) {
                $parts[] = $location['specificPlace'];
            }
            if (!empty($location['building'])) {
                $parts[] = $location['building'];
            }
            if (!empty($location['address'])) {
                $parts[] = $location['address'];
            }

            $fullText = implode(', ', $parts);
        }

        if (empty($fullText) && !empty($report->building)) {
            $fullText = $report->building;
        }
        if (empty($fullText) && !empty($report->address)) {
            $fullText = $report->address;
        }
        if (empty($fullText) && !empty($report->specificPlace)) {
            $fullText = $report->specificPlace;
        }

        $matchedLocation = $this->determineReportLocation($report, false);
        if ($matchedLocation && !empty($fullText)) {
            $displayName = $this->getLocationDisplayName($matchedLocation);
            $shortKey = $this->getLocationKey($matchedLocation);

            $fullText = str_ireplace($displayName, '', $fullText);
            $fullText = str_ireplace($shortKey, '', $fullText);
            $fullText = str_ireplace($matchedLocation, '', $fullText);
            $fullText = str_ireplace('Mahallah ', '', $fullText);
            $fullText = str_ireplace('Kulliyyah ', '', $fullText);

            $fullText = preg_replace('/\s+/', ' ', $fullText);
            $fullText = preg_replace('/,\s*,/', ',', $fullText);
            $fullText = preg_replace('/^\s*,\s*/', '', $fullText);
            $fullText = preg_replace('/\s*,\s*$/', '', $fullText);
            $fullText = trim($fullText, ' ,');
        }

        return !empty($fullText) ? $fullText : '';
    }

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

    protected function groupReportsByProximity($reports)
    {
        $grouped = collect();
        $unassigned = [];

        foreach ($reports as $report) {
            $assigned = false;

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

            if (!$assigned) {
                $reportCoords = $this->getReportCoordinates($report);
                if ($reportCoords && !empty($this->mainLocationCoordinates)) {
                    $bestMatch = null;
                    $bestDistance = PHP_FLOAT_MAX;

                    foreach ($this->mainLocationCoordinates as $locationName => $locationCoords) {
                        $radius = $this->mainLocations[$locationName]['map_radius'] ?? 250;

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

    protected function determineEmergencyLocation($emergency)
    {
        $emergencyCoords = $this->getEmergencyCoordinates($emergency);
        if ($emergencyCoords && !empty($this->mainLocationCoordinates)) {
            $matchedLocation = $this->findClosestLocationForMap($emergencyCoords);
            if ($matchedLocation) {
                return $this->getLocationKey($matchedLocation);
            }
        }
        return null;
    }
}
