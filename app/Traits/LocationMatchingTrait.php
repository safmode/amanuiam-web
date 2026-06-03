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
     * Determine report location using PROXIMITY first, then keyword matching
     */
    protected function determineReportLocation($report, $returnKey = true)
    {
        // METHOD 1: Try proximity matching using coordinates (MOST ACCURATE)
        $reportCoords = $this->getReportCoordinates($report);
        if ($reportCoords && !empty($this->mainLocationCoordinates)) {
            $matchedLocation = $this->findClosestLocationByProximity($reportCoords);
            if ($matchedLocation) {
                $key = $this->getLocationKey($matchedLocation);
                $distance = $this->calculateDistance(
                    $reportCoords['lat'], $reportCoords['lng'],
                    $this->mainLocationCoordinates[$matchedLocation]['lat'],
                    $this->mainLocationCoordinates[$matchedLocation]['lng']
                );
                Log::info('Report ' . ($report->reportId ?? 'unknown') . ' matched by PROXIMITY: ' . $key . ' (distance: ' . round($distance, 2) . 'm)');
                return $returnKey ? $key : $matchedLocation;
            }
        }

        // METHOD 2: Fallback to keyword matching using locationArea
        $locationArea = $this->getLocationAreaFromReport($report);

        if (!empty($locationArea)) {
            $locationAreaLower = strtolower($locationArea);

            // Check for IIiBF specifically first (higher priority)
            if (strpos($locationAreaLower, 'iibf') !== false || strpos($locationAreaLower, 'islamic banking') !== false) {
                return $returnKey ? 'KICT' : 'KICT (ICT)';
            }

            // Check for KOED (Education)
            if (strpos($locationAreaLower, 'koed') !== false || strpos($locationAreaLower, 'education') !== false) {
                return $returnKey ? 'KOED' : 'KOED (Education)';
            }

            // Check for KOE (Engineering)
            if (strpos($locationAreaLower, 'koe') !== false || strpos($locationAreaLower, 'engineering') !== false) {
                return $returnKey ? 'KOE' : 'KOE (Engineering)';
            }

            // Check for KICT
            if (strpos($locationAreaLower, 'kict') !== false || strpos($locationAreaLower, 'information technology') !== false) {
                return $returnKey ? 'KICT' : 'KICT (ICT)';
            }

            // Check for KIRKHS
            if (strpos($locationAreaLower, 'kirkhs') !== false || strpos($locationAreaLower, 'human sciences') !== false) {
                return $returnKey ? 'KIRKHS' : 'KIRKHS (AHAS KIRKHS)';
            }

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
                    return $returnKey ? $key : 'Mahallah ' . ucfirst($keyword);
                }
            }

            // Check for Facilities
            $facilities = [
                'library' => 'Dar al-Hikmah Library',
                'stadium' => 'Saidina Hamzah Stadium',
                'archery' => 'IIUM Archery Range',
                'football' => 'UIA Football Turf',
                'cricket' => 'IIUM Cricket Ground',
                'rugby' => 'IIUM Rugby Field',
                'educare' => 'IIUM Educare',
                'mosque' => 'Sultan Haji Ahmad Shah Mosque',
                'masjid' => 'Sultan Haji Ahmad Shah Mosque',
            ];

            foreach ($facilities as $keyword => $displayName) {
                if (strpos($locationAreaLower, $keyword) !== false) {
                    $key = str_replace(' ', '_', $displayName);
                    return $returnKey ? $key : $displayName;
                }
            }

            // Fallback to original matching
            $matchedLocation = $this->matchLocationToMainLocation($locationArea);
            if ($matchedLocation) {
                return $returnKey ? $this->getLocationKey($matchedLocation) : $matchedLocation;
            }
        }

        // METHOD 3: Try matching by description/address (only if no coordinates)
        $description = $report->description ?? '';
        $address = $this->getAddressFromReport($report);
        $searchText = strtolower($description . ' ' . $address);

        foreach ($this->mainLocations as $locationName => $config) {
            foreach ($config['keywords'] as $keyword) {
                if (strpos($searchText, strtolower($keyword)) !== false) {
                    Log::info('Report ' . ($report->reportId ?? 'unknown') . ' matched by KEYWORD: ' . $config['key']);
                    return $returnKey ? $this->getLocationKey($locationName) : $locationName;
                }
            }
        }

        // Fallback: return the original locationArea
        $locationArea = $this->getLocationAreaFromReport($report);
        Log::info('Report ' . ($report->reportId ?? 'unknown') . ' using fallback locationArea: ' . $locationArea);
        return !empty($locationArea) ? ($returnKey ? $locationArea : $locationArea) : null;
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
     * Determine emergency location using PROXIMITY first, then keyword fallback
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

        // METHOD 2: Fallback to keyword matching on address
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
                'kaed' => 'KAED', 'kenms' => 'KENMS', 'aikol' => 'AIKOL',
                'koed' => 'KOED', 'library' => 'Dar al-Hikmah Library',
                'stadium' => 'Saidina Hamzah Stadium', 'mosque' => 'Sultan Haji Ahmad Shah Mosque',
                'masjid' => 'Sultan Haji Ahmad Shah Mosque', 'engineering' => 'KOE',
                'education' => 'KOED',
            ];

            foreach ($locationMap as $keyword => $locationKey) {
                if (strpos($address, $keyword) !== false) {
                    Log::info('Emergency location matched by KEYWORD: ' . $locationKey . ' from address: ' . $address);
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

    // ============================================
    // NEW LOCATION SPLITTING METHODS
    // ============================================

    /**
     * Split location into area and specific place/building
     * This intelligently separates the main location area from specific places
     */
    protected function splitLocationIntoAreaAndPlace($report, $inputAddress = null)
    {
        // Get raw address or location text
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
            '7 eleven', '7-eleven', 'seven eleven',
            'office', 'cafe', 'cafeteria', 'restaurant', 'food court',
            'gym', 'library', 'store', 'shop', 'convenience store',
            'kfc', 'mcdonald', 'starbucks', 'tealive', 'chatime',
            'clinic', 'pharmacy', 'bank', 'atm', 'laundry',
            'computer lab', 'study room', 'lecture hall', 'classroom',
            'auditorium', 'conference room', 'meeting room',
            'prayer room', 'surau', 'toilet', 'washroom'
        ];

        // Check if address contains a specific place
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

        // First, try to determine the main location area by proximity
        $locationArea = $this->determineReportLocation($report, false);

        // If proximity didn't work, try to extract from address
        if (!$locationArea) {
            // Try to find Mahallah names
            $mahallahs = [
                'asiah', 'aminah', 'safiyyah', 'maryam', 'ruqayyah',
                'ali', 'faruq', 'bilal', 'asma', 'hafsah', 'halimah',
                'siddiq', 'salahuddin', 'uthman', 'nusaibah', 'zubair', 'sumayyah'
            ];

            foreach ($mahallahs as $mahallah) {
                if (strpos($addressLower, $mahallah) !== false) {
                    $locationArea = 'Mahallah ' . ucfirst($mahallah);
                    break;
                }
            }

            // Try to find Kulliyyah names
            if (!$locationArea) {
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
                        $locationArea = $name;
                        break;
                    }
                }
            }

            // Try to find facilities
            if (!$locationArea) {
                $facilities = [
                    'library' => 'Dar al-Hikmah Library',
                    'stadium' => 'Saidina Hamzah Stadium',
                    'mosque' => 'Sultan Haji Ahmad Shah Mosque',
                    'masjid' => 'Sultan Haji Ahmad Shah Mosque',
                    'sports complex' => 'Female Sports Complex',
                    'archery' => 'IIUM Archery Range',
                    'football' => 'UIA Football Turf',
                    'cricket' => 'IIUM Cricket Ground',
                    'rugby' => 'IIUM Rugby Field',
                    'educare' => 'IIUM Educare'
                ];

                foreach ($facilities as $keyword => $name) {
                    if (strpos($addressLower, $keyword) !== false) {
                        $locationArea = $name;
                        break;
                    }
                }
            }
        }

        // If still no location area, use default or extract from address
        if (!$locationArea) {
            // Try to extract anything that looks like a place name
            $words = explode(' ', $address);
            foreach ($words as $word) {
                if (strlen($word) > 5 && ctype_alpha($word)) {
                    $locationArea = ucfirst(strtolower($word));
                    break;
                }
            }
        }

        // Determine specific place based on what we found
        $specificPlace = $foundSpecificPlace;

        // If we have a building but no specific place, use building as specific place
        if ($foundBuilding && !$specificPlace) {
            $specificPlace = $foundBuilding;
        }

        // If we have remaining text after removing the location area, use as specific place
        $remainingAddress = $address;
        if ($locationArea && strpos($addressLower, strtolower($locationArea)) !== false) {
            $remainingAddress = trim(str_ireplace($locationArea, '', $address));
            $remainingAddress = trim(str_ireplace($specificPlace ?? '', '', $remainingAddress));
            $remainingAddress = preg_replace('/^[,]+|[,]+$/', '', $remainingAddress);
            $remainingAddress = trim($remainingAddress);

            if ($remainingAddress && !$specificPlace) {
                $specificPlace = $remainingAddress;
            }
        }

        return [
            'locationArea' => $locationArea,
            'specificPlace' => $specificPlace,
            'building' => $foundBuilding
        ];
    }

    /**
     * Get full address string from report
     */
    protected function getFullAddressString($report)
    {
        $addressParts = [];

        // Check location object
        $location = $report->location;
        if (is_array($location)) {
            if (!empty($location['locationArea'])) {
                $addressParts[] = $location['locationArea'];
            }
            if (!empty($location['specificPlace'])) {
                $addressParts[] = $location['specificPlace'];
            }
            if (!empty($location['building'])) {
                $addressParts[] = $location['building'];
            }
            if (!empty($location['address'])) {
                $addressParts[] = $location['address'];
            }
        } elseif (is_object($location)) {
            if (!empty($location->locationArea)) {
                $addressParts[] = $location->locationArea;
            }
            if (!empty($location->specificPlace)) {
                $addressParts[] = $location->specificPlace;
            }
            if (!empty($location->building)) {
                $addressParts[] = $location->building;
            }
            if (!empty($location->address)) {
                $addressParts[] = $location->address;
            }
        }

        // Fallback to old fields
        if (empty($addressParts)) {
            if (!empty($report->mahallah)) {
                $addressParts[] = $report->mahallah;
            }
            if (!empty($report->building)) {
                $addressParts[] = $report->building;
            }
            if (!empty($report->address)) {
                $addressParts[] = $report->address;
            }
        }

        // If still empty, try from description (first line only)
        if (empty($addressParts) && !empty($report->description)) {
            $firstLine = explode("\n", $report->description)[0];
            if (strlen($firstLine) < 100) {
                $addressParts[] = $firstLine;
            }
        }

        return implode(', ', array_filter($addressParts));
    }
}
