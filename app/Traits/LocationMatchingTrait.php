<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;

trait LocationMatchingTrait
{
    // Define main locations with their keywords and radius
    private $mainLocations = [
        // Mahallahs
        'Mahallah Asiah' => ['keywords' => ['asiah', 'mahallah asiah'], 'radius' => 200],
        'Mahallah Aminah' => ['keywords' => ['aminah', 'mahallah aminah'], 'radius' => 200],
        'Mahallah Safiyyah' => ['keywords' => ['safiyyah', 'mahallah safiyyah'], 'radius' => 200],
        'Mahallah Maryam' => ['keywords' => ['maryam', 'mahallah maryam'], 'radius' => 200],
        'Mahallah Ruqayyah' => ['keywords' => ['ruqayyah', 'mahallah ruqayyah'], 'radius' => 200],
        'Mahallah Ali' => ['keywords' => ['ali', 'mahallah ali'], 'radius' => 200],
        'Mahallah Faruq' => ['keywords' => ['faruq', 'mahallah faruq'], 'radius' => 200],
        'Mahallah Bilal' => ['keywords' => ['bilal', 'mahallah bilal'], 'radius' => 200],
        'Mahallah Asma' => ['keywords' => ['asma', 'mahallah asma'], 'radius' => 200],
        'Mahallah Hafsah' => ['keywords' => ['hafsah', 'mahallah hafsah'], 'radius' => 200],
        'Mahallah Halimah' => ['keywords' => ['halimah', 'mahallah halimah'], 'radius' => 200],
        'Mahallah Siddiq' => ['keywords' => ['siddiq', 'mahallah siddiq'], 'radius' => 200],
        'Mahallah Salahuddin' => ['keywords' => ['salahuddin', 'mahallah salahuddin'], 'radius' => 200],
        'Mahallah Uthman' => ['keywords' => ['uthman', 'mahallah uthman'], 'radius' => 200],
        'Mahallah Nusaibah' => ['keywords' => ['nusaibah', 'mahallah nusaibah'], 'radius' => 200],
        'Mahallah Zubair Al-Awwam' => ['keywords' => ['zubair', 'mahallah zubair'], 'radius' => 200],
        'Mahallah Sumayyah' => ['keywords' => ['sumayyah', 'mahallah sumayyah'], 'radius' => 200],

        // Kulliyyahs
        'KIRKHS (AHAS KIRKHS)' => ['keywords' => ['kirkhs', 'kulliyyah of human sciences', 'ahmad ibrahim', 'human sciences', 'kulliyyah of islamic revealed knowledge'], 'radius' => 150],
        'KICT (ICT)' => ['keywords' => ['kict', 'ict', 'information technology', 'computer science', 'kulliyyah of information and communication technology', 'iibf', 'islamic banking', 'islamic banking & finance', 'iiibf'], 'radius' => 200],
        'KOE (Engineering)' => ['keywords' => ['koe', 'engineering', 'engineer', 'kulliyyah of engineering', 'kuliyah engineering'], 'radius' => 150],
        'KAED (Architecture)' => ['keywords' => ['kaed', 'architecture', 'design', 'architect', 'kulliyyah of architecture'], 'radius' => 150],
        'KENMS (Economics)' => ['keywords' => ['kenms', 'economics', 'management', 'business', 'kulliyyah of economics'], 'radius' => 150],
        'AIKOL (Law)' => ['keywords' => ['aikol', 'law', 'legal', 'kulliyyah of law'], 'radius' => 150],
        'KOED (Education)' => ['keywords' => ['koed', 'education', 'teaching', 'kulliyyah of education'], 'radius' => 150],

        // Facilities
        'Dar al-Hikmah Library' => ['keywords' => ['library', 'dar al-hikmah', 'perpustakaan'], 'radius' => 100],
        'Female Sports Complex' => ['keywords' => ['female sports', 'sports complex', 'gym', 'women sports'], 'radius' => 150],
        'Saidina Hamzah Stadium' => ['keywords' => ['stadium', 'saidina hamzah', 'field'], 'radius' => 200],
        'IIUM Archery Range' => ['keywords' => ['archery', 'panahan'], 'radius' => 100],
        'UIA Football Turf' => ['keywords' => ['football', 'soccer', 'turf'], 'radius' => 120],
        'IIUM Cricket Ground' => ['keywords' => ['cricket', 'ground'], 'radius' => 150],
        'IIUM Rugby Field' => ['keywords' => ['rugby', 'field'], 'radius' => 150],
        'Padang Kawad UIAM' => ['keywords' => ['padang kawad', 'parade', 'kawad'], 'radius' => 150],
        'IIUM Educare' => ['keywords' => ['educare', 'kindergarten', 'preschool', 'taska'], 'radius' => 100],
        'Sultan Haji Ahmad Shah Mosque' => ['keywords' => ['mosque', 'masjid', 'sultan haji ahmad shah', 'prayer hall', 'surau'], 'radius' => 150],
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
     * Determine report location using keyword matching first, then proximity
     */
    protected function determineReportLocation($report)
    {
        // METHOD 1: Try keyword matching using locationArea
        $locationArea = $this->getLocationAreaFromReport($report);
        if (!empty($locationArea)) {
            $matchedLocation = $this->matchLocationToMainLocation($locationArea);
            if ($matchedLocation) {
                return $matchedLocation;
            }
        }

        // METHOD 2: Try proximity matching using actual coordinates
        $reportCoords = $this->getReportCoordinates($report);
        if ($reportCoords) {
            $matchedLocation = $this->findClosestLocationByProximity($reportCoords);
            if ($matchedLocation) {
                return $matchedLocation;
            }
        }

        // METHOD 3: Try matching by description/address
        $description = $report->description ?? '';
        $address = $this->getAddressFromReport($report);
        $searchText = strtolower($description . ' ' . $address);

        foreach ($this->mainLocations as $locationName => $config) {
            foreach ($config['keywords'] as $keyword) {
                if (strpos($searchText, strtolower($keyword)) !== false) {
                    return $locationName;
                }
            }
        }

        // Fallback: return the original locationArea
        return !empty($locationArea) ? $locationArea : null;
    }
}
