<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;

trait ReportLocationTrait
{
    private $reportLocations = [
        // Mahallahs
        'Mahallah Asiah' => ['keywords' => ['asiah', 'mahallah asiah'], 'key' => 'Asiah', 'display' => 'Mahallah Asiah'],
        'Mahallah Aminah' => ['keywords' => ['aminah', 'mahallah aminah'], 'key' => 'Aminah', 'display' => 'Mahallah Aminah'],
        'Mahallah Safiyyah' => ['keywords' => ['safiyyah', 'mahallah safiyyah'], 'key' => 'Safiyyah', 'display' => 'Mahallah Safiyyah'],
        'Mahallah Maryam' => ['keywords' => ['maryam', 'mahallah maryam'], 'key' => 'Maryam', 'display' => 'Mahallah Maryam'],
        'Mahallah Ruqayyah' => ['keywords' => ['ruqayyah', 'mahallah ruqayyah'], 'key' => 'Ruqayyah', 'display' => 'Mahallah Ruqayyah'],
        'Mahallah Ali' => ['keywords' => ['ali', 'mahallah ali'], 'key' => 'Ali', 'display' => 'Mahallah Ali'],
        'Mahallah Faruq' => ['keywords' => ['faruq', 'mahallah faruq'], 'key' => 'Faruq', 'display' => 'Mahallah Faruq'],
        'Mahallah Bilal' => ['keywords' => ['bilal', 'mahallah bilal'], 'key' => 'Bilal', 'display' => 'Mahallah Bilal'],
        'Mahallah Asma' => ['keywords' => ['asma', 'mahallah asma'], 'key' => 'Asma', 'display' => 'Mahallah Asma'],
        'Mahallah Hafsah' => ['keywords' => ['hafsah', 'mahallah hafsah'], 'key' => 'Hafsah', 'display' => 'Mahallah Hafsah'],
        'Mahallah Halimah' => ['keywords' => ['halimah', 'mahallah halimah'], 'key' => 'Halimah', 'display' => 'Mahallah Halimah'],
        'Mahallah Siddiq' => ['keywords' => ['siddiq', 'mahallah siddiq'], 'key' => 'Siddiq', 'display' => 'Mahallah Siddiq'],
        'Mahallah Salahuddin' => ['keywords' => ['salahuddin', 'mahallah salahuddin'], 'key' => 'Salahuddin', 'display' => 'Mahallah Salahuddin'],
        'Mahallah Uthman' => ['keywords' => ['uthman', 'mahallah uthman'], 'key' => 'Uthman', 'display' => 'Mahallah Uthman'],
        'Mahallah Nusaibah' => ['keywords' => ['nusaibah', 'mahallah nusaibah'], 'key' => 'Nusaibah', 'display' => 'Mahallah Nusaibah'],
        'Mahallah Zubair Al-Awwam' => ['keywords' => ['zubair', 'mahallah zubair'], 'key' => 'Zubair Al-Awwam', 'display' => 'Mahallah Zubair'],
        'Mahallah Sumayyah' => ['keywords' => ['sumayyah', 'mahallah sumayyah'], 'key' => 'Sumayyah', 'display' => 'Mahallah Sumayyah'],

        // Kulliyyahs
        'KIRKHS (AHAS KIRKHS)' => ['keywords' => ['kirkhs', 'kulliyyah of human sciences', 'human sciences'], 'key' => 'KIRKHS', 'display' => 'KIRKHS (AHAS KIRKHS)'],
        'KICT (ICT)' => ['keywords' => ['kict', 'ict', 'information technology', 'iibf', 'islamic banking'], 'key' => 'KICT', 'display' => 'KICT (ICT)'],
        'KOE (Engineering)' => ['keywords' => ['koe', 'engineering'], 'key' => 'KOE', 'display' => 'KOE (Engineering)'],
        'KAED (Architecture)' => ['keywords' => ['kaed', 'architecture'], 'key' => 'KAED', 'display' => 'KAED (Architecture)'],
        'KENMS (Economics)' => ['keywords' => ['kenms', 'economics'], 'key' => 'KENMS', 'display' => 'KENMS (Economics)'],
        'AIKOL (Law)' => ['keywords' => ['aikol', 'law'], 'key' => 'AIKOL', 'display' => 'AIKOL (Law)'],
        'KOED (Education)' => ['keywords' => ['koed', 'education'], 'key' => 'KOED', 'display' => 'KOED (Education)'],

        // Facilities
        'Dar al-Hikmah Library' => ['keywords' => ['library', 'dar al-hikmah'], 'key' => 'Dar al-Hikmah Library', 'display' => 'Dar al-Hikmah Library'],
        'Female Sports Complex' => ['keywords' => ['female sports', 'sports complex', 'gym'], 'key' => 'Female Sports Complex', 'display' => 'Female Sports Complex'],
        'Saidina Hamzah Stadium' => ['keywords' => ['stadium', 'saidina hamzah'], 'key' => 'Saidina Hamzah Stadium', 'display' => 'Saidina Hamzah Stadium'],
        'IIUM Archery Range' => ['keywords' => ['archery', 'panahan'], 'key' => 'IIUM Archery Range', 'display' => 'IIUM Archery Range'],
        'UIA Football Turf' => ['keywords' => ['football', 'soccer', 'turf'], 'key' => 'UIA Football Turf', 'display' => 'UIA Football Turf'],
        'IIUM Cricket Ground' => ['keywords' => ['cricket', 'ground'], 'key' => 'IIUM Cricket Ground', 'display' => 'IIUM Cricket Ground'],
        'IIUM Rugby Field' => ['keywords' => ['rugby', 'field'], 'key' => 'IIUM Rugby Field', 'display' => 'IIUM Rugby Field'],
        'Padang Kawad UIAM' => ['keywords' => ['padang kawad', 'parade'], 'key' => 'Padang Kawad UIAM', 'display' => 'Padang Kawad UIAM'],
        'IIUM Educare' => ['keywords' => ['educare', 'kindergarten'], 'key' => 'IIUM Educare', 'display' => 'IIUM Educare'],
        'Sultan Haji Ahmad Shah Mosque' => ['keywords' => ['mosque', 'masjid'], 'key' => 'Sultan Haji Ahmad Shah Mosque', 'display' => 'Sultan Haji Ahmad Shah Mosque'],
    ];

    private $locationCoordinates = [];

    protected function initLocationMatching()
    {
        if (file_exists(config_path('map_coordinates.php'))) {
            $this->locationCoordinates = include(config_path('map_coordinates.php'));
            Log::info('Loaded ' . count($this->locationCoordinates) . ' coordinates');
        }
    }

    protected function getReportCoordinates($report)
    {
        if (!isset($report->location)) return null;
        $location = $report->location;
        if (is_string($location)) $location = json_decode($location, true);
        if (!is_array($location)) return null;

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
        if (!isset($report->location)) return '';
        $location = $report->location;
        if (is_string($location)) $location = json_decode($location, true);
        if (is_array($location)) return $location['locationArea'] ?? '';
        if (is_object($location) && isset($location->locationArea)) return $location->locationArea;
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

    protected function extractLocationFromText($text)
    {
        if (empty($text)) return null;
        $textLower = strtolower($text);
        foreach ($this->reportLocations as $locationName => $config) {
            foreach ($config['keywords'] as $keyword) {
                if (strpos($textLower, strtolower($keyword)) !== false) {
                    return ['location' => $locationName, 'display' => $config['display'], 'key' => $config['key']];
                }
            }
        }
        return null;
    }

    protected function matchLocationToMainLocation($locationArea)
    {
        if (empty($locationArea)) return null;
        $locationAreaLower = strtolower($locationArea);
        foreach ($this->reportLocations as $locationName => $config) {
            foreach ($config['keywords'] as $keyword) {
                if (strpos($locationAreaLower, strtolower($keyword)) !== false) {
                    return $locationName;
                }
            }
        }
        return null;
    }

    protected function getLocationKey($locationName)
    {
        foreach ($this->reportLocations as $fullName => $config) {
            if ($fullName === $locationName) return $config['key'];
        }
        return $locationName;
    }

    protected function getLocationDisplayName($locationName)
    {
        foreach ($this->reportLocations as $fullName => $config) {
            if ($fullName === $locationName) return $config['display'];
        }
        return $locationName;
    }

    /**
     * Smart location splitter for reports - TEXT PRIORITY
     */
    protected function smartSplitLocation($inputText)
    {
        if (empty($inputText)) return ['locationArea' => null, 'specificAddress' => null];

        $matched = $this->extractLocationFromText($inputText);
        if ($matched) {
            $specificAddress = trim(str_ireplace($matched['display'], '', $inputText));
            $specificAddress = trim(str_ireplace($matched['key'], '', $specificAddress));
            $specificAddress = preg_replace('/\s+/', ' ', $specificAddress);
            $specificAddress = trim($specificAddress, ' ,');
            return ['locationArea' => $matched['display'], 'specificAddress' => !empty($specificAddress) ? $specificAddress : null];
        }
        return ['locationArea' => null, 'specificAddress' => $inputText];
    }

    /**
     * Determine report location - TEXT FIRST, then coordinates
     */
    protected function determineReportLocation($report, $returnKey = true)
    {
        // Check existing valid location
        $existing = $this->getLocationAreaFromReport($report);
        if (!empty($existing)) {
            $matched = $this->matchLocationToMainLocation($existing);
            if ($matched) return $returnKey ? $this->getLocationKey($matched) : $matched;
        }

        // Check address text
        $address = $this->getFullAddressString($report);
        if (!empty($address)) {
            $matched = $this->extractLocationFromText($address);
            if ($matched) return $returnKey ? $matched['key'] : $matched['location'];
        }

        // Check description
        if (empty($address) && !empty($report->description)) {
            $matched = $this->extractLocationFromText($report->description);
            if ($matched) return $returnKey ? $matched['key'] : $matched['location'];
        }

        // Check coordinates (with 200m radius for reports)
        $coords = $this->getReportCoordinates($report);
        if ($coords && !empty($this->locationCoordinates)) {
            $bestMatch = null;
            $bestDistance = 200;
            foreach ($this->locationCoordinates as $locationName => $locCoords) {
                $distance = $this->calculateDistance($coords['lat'], $coords['lng'], $locCoords['lat'], $locCoords['lng']);
                if ($distance <= 200 && $distance < $bestDistance) {
                    $bestDistance = $distance;
                    $bestMatch = $locationName;
                }
            }
            if ($bestMatch) return $returnKey ? $this->getLocationKey($bestMatch) : $bestMatch;
        }

        return $returnKey ? null : null;
    }

    protected function getFullAddressString($report)
    {
        $parts = [];
        if (isset($report->location)) {
            $loc = $report->location;
            if (is_string($loc)) $loc = json_decode($loc, true);
            if (is_array($loc)) {
                if (!empty($loc['address'])) $parts[] = $loc['address'];
                if (!empty($loc['building'])) $parts[] = $loc['building'];
                if (!empty($loc['specificPlace'])) $parts[] = $loc['specificPlace'];
                if (!empty($loc['locationArea'])) $parts[] = $loc['locationArea'];
            }
        }
        if (empty($parts)) {
            if (!empty($report->building)) $parts[] = $report->building;
            if (!empty($report->address)) $parts[] = $report->address;
            if (!empty($report->mahallah)) $parts[] = $report->mahallah;
        }
        return implode(', ', $parts);
    }

    protected function getOriginalLocationText($report)
    {
        $loc = $report->location;
        if (is_string($loc)) $loc = json_decode($loc, true);
        $text = '';
        if (is_array($loc)) {
            if (!empty($loc['specificPlace'])) $text = $loc['specificPlace'];
            elseif (!empty($loc['building'])) $text = $loc['building'];
            elseif (!empty($loc['address'])) $text = $loc['address'];
        }
        if (empty($text) && !empty($report->building)) $text = $report->building;
        if (empty($text) && !empty($report->address)) $text = $report->address;

        $matched = $this->determineReportLocation($report, false);
        if ($matched && !empty($text)) {
            $display = $this->getLocationDisplayName($matched);
            $text = trim(str_ireplace($display, '', $text));
            $text = trim($text, ' ,');
        }
        return !empty($text) ? $text : '';
    }
}
