<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;

trait LocationMatchingTrait
{
    private $mainLocations = [
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
        'KIRKHS (AHAS KIRKHS)' => ['keywords' => ['kirkhs', 'kulliyyah of human sciences'], 'radius' => 150, 'key' => 'KIRKHS'],
        'KICT (ICT)' => ['keywords' => ['kict', 'ict', 'information technology'], 'radius' => 200, 'key' => 'KICT'],
        'KOE (Engineering)' => ['keywords' => ['koe', 'engineering'], 'radius' => 150, 'key' => 'KOE'],
        'KAED (Architecture)' => ['keywords' => ['kaed', 'architecture'], 'radius' => 150, 'key' => 'KAED'],
        'KENMS (Economics)' => ['keywords' => ['kenms', 'economics'], 'radius' => 150, 'key' => 'KENMS'],
        'AIKOL (Law)' => ['keywords' => ['aikol', 'law'], 'radius' => 150, 'key' => 'AIKOL'],
        'KOED (Education)' => ['keywords' => ['koed', 'education'], 'radius' => 150, 'key' => 'KOED'],
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

    protected function initLocationMatching()
    {
        if (file_exists(config_path('map_coordinates.php'))) {
            $this->mainLocationCoordinates = include(config_path('map_coordinates.php'));
            Log::info('Loaded ' . count($this->mainLocationCoordinates) . ' coordinates for location matching');
        }
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

        if (isset($report->locationArea)) {
            return $report->locationArea;
        }

        return '';
    }

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

    protected function getLocationKey($locationName)
    {
        foreach ($this->mainLocations as $fullName => $config) {
            if ($fullName === $locationName) {
                return $config['key'];
            }
        }
        return $locationName;
    }

    protected function determineReportLocation($report, $returnKey = true)
    {
        if (!isset($report->location) && empty($report->mahallah)) {
            return $returnKey ? null : null;
        }

        $reportCoords = $this->getReportCoordinates($report);
        if ($reportCoords && !empty($this->mainLocationCoordinates)) {
            $matchedLocation = $this->findClosestLocationByProximity($reportCoords);
            if ($matchedLocation) {
                $key = $this->getLocationKey($matchedLocation);
                Log::info('Report matched by PROXIMITY: ' . $key);
                return $returnKey ? $key : $matchedLocation;
            }
        }

        $locationArea = $this->getLocationAreaFromReport($report);
        if (!empty($locationArea)) {
            $locationAreaLower = strtolower($locationArea);
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
                    return $returnKey ? $key : 'Mahallah ' . ucfirst($keyword);
                }
            }
            $kulliyyahs = [
                'kirkhs' => 'KIRKHS', 'kict' => 'KICT', 'koe' => 'KOE',
                'kaed' => 'KAED', 'kenms' => 'KENMS', 'aikol' => 'AIKOL', 'koed' => 'KOED'
            ];
            foreach ($kulliyyahs as $keyword => $key) {
                if (strpos($locationAreaLower, $keyword) !== false) {
                    return $returnKey ? $key : $key;
                }
            }
        }

        return !empty($locationArea) ? ($returnKey ? $locationArea : $locationArea) : null;
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
            $matchedLocation = $this->findClosestLocationByProximity($emergencyCoords);
            if ($matchedLocation) {
                return $this->getLocationKey($matchedLocation);
            }
        }
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
                    return $locationKey;
                }
            }
            if (preg_match('/mahallah\s+(\w+)/i', $address, $matches)) {
                return ucfirst(strtolower($matches[1]));
            }
        }
        return null;
    }

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
        $specificPlaces = [
            '7 eleven', '7-eleven', 'seven eleven', 'office', 'cafe', 'cafeteria',
            'restaurant', 'food court', 'gym', 'library', 'store', 'shop'
        ];
        $foundSpecificPlace = null;
        foreach ($specificPlaces as $place) {
            if (strpos($addressLower, $place) !== false) {
                $foundSpecificPlace = $place;
                break;
            }
        }
        $buildingPattern = '/(block|blk|building|bldg|tower|wing|floor|level|room|rm|suite|unit|no\.|#)\s*([a-z0-9\-]+)/i';
        $foundBuilding = null;
        if (preg_match($buildingPattern, $address, $matches)) {
            $foundBuilding = trim($matches[0]);
        }
        $locationArea = $this->determineReportLocation($report, false);
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
        return ['locationArea' => $locationArea, 'specificPlace' => $specificPlace, 'building' => $foundBuilding];
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
        if (empty($addressParts)) {
            if (!empty($report->mahallah)) $addressParts[] = $report->mahallah;
            if (!empty($report->building)) $addressParts[] = $report->building;
            if (!empty($report->address)) $addressParts[] = $report->address;
        }
        if (empty($addressParts) && !empty($report->description)) {
            $firstLine = explode("\n", $report->description)[0];
            if (strlen($firstLine) < 100) $addressParts[] = $firstLine;
        }
        return implode(', ', array_filter($addressParts));
    }
}
