<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class SeedMapCoordinates extends Command
{
    protected $signature = 'map:seed-coordinates';
    protected $description = 'Seed map coordinates from Google Geocoding API (one time only)';

    public function handle()
    {
        $googleApiKey = env('GOOGLE_MAPS_API_KEY');

        if (empty($googleApiKey)) {
            $this->error('GOOGLE_MAPS_API_KEY not set in .env file');
            return 1;
        }

        $mainLocations = [
            // Mahallahs with specific building names for better accuracy
            ['name' => 'Mahallah Asiah', 'address' => 'Kolej Kediaman Asiah, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Mahallah Aminah', 'address' => 'Kolej Kediaman Aminah, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Mahallah Safiyyah', 'address' => 'Kolej Kediaman Safiyyah, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Mahallah Maryam', 'address' => 'Kolej Kediaman Maryam, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Mahallah Ruqayyah', 'address' => 'Kolej Kediaman Ruqayyah, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Mahallah Ali', 'address' => 'Kolej Kediaman Ali, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Mahallah Faruq', 'address' => 'Kolej Kediaman Faruq, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Mahallah Bilal', 'address' => 'Kolej Kediaman Bilal, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Mahallah Asma', 'address' => 'Kolej Kediaman Asma, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Mahallah Hafsah', 'address' => 'Kolej Kediaman Hafsah, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Mahallah Halimah', 'address' => 'Kolej Kediaman Halimah, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Mahallah Siddiq', 'address' => 'Kolej Kediaman Siddiq, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Mahallah Salahuddin', 'address' => 'Kolej Kediaman Salahuddin, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Mahallah Uthman', 'address' => 'Kolej Kediaman Uthman, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Mahallah Nusaibah', 'address' => 'Kolej Kediaman Nusaibah, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Mahallah Zubair Al-Awwam', 'address' => 'Kolej Kediaman Zubair, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Mahallah Sumayyah', 'address' => 'Kolej Kediaman Sumayyah, IIUM Gombak, Selangor, Malaysia'],

            // Kulliyyahs with specific building names
            ['name' => 'KIRKHS (AHAS KIRKHS)', 'address' => 'Kulliyyah of Human Sciences Building, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'KICT (ICT)', 'address' => 'Kulliyyah of Information and Communication Technology Building, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'KOE (Engineering)', 'address' => 'Kulliyyah of Engineering Building, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'KAED (Architecture)', 'address' => 'Kulliyyah of Architecture and Environmental Design Building, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'KENMS (Economics)', 'address' => 'Kulliyyah of Economics and Management Sciences Building, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'AIKOL (Law)', 'address' => 'Ahmad Ibrahim Kulliyyah of Laws Building, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'KOED (Education)', 'address' => 'Kulliyyah of Education Building, IIUM Gombak, Selangor, Malaysia'],

            // Facilities with specific names
            ['name' => 'Dar al-Hikmah Library', 'address' => 'Dar al-Hikmah Library, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Female Sports Complex', 'address' => 'Female Sports Complex, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Saidina Hamzah Stadium', 'address' => 'Saidina Hamzah Stadium, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'IIUM Archery Range', 'address' => 'IIUM Archery Range, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'UIA Football Turf', 'address' => 'UIA Football Turf, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'IIUM Cricket Ground', 'address' => 'IIUM Cricket Ground, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'IIUM Rugby Field', 'address' => 'IIUM Rugby Field, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Padang Kawad UIAM', 'address' => 'Padang Kawad, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'IIUM Educare', 'address' => 'IIUM Educare, IIUM Gombak, Selangor, Malaysia'],
            ['name' => 'Sultan Haji Ahmad Shah Mosque IIUM', 'address' => 'Sultan Haji Ahmad Shah Mosque, IIUM Gombak, Selangor, Malaysia'],
        ];

        $coordinates = [];

        foreach ($mainLocations as $location) {
            $this->info("Geocoding: {$location['name']}...");
            $this->info("  Address: {$location['address']}");

            $response = Http::get('https://maps.googleapis.com/maps/api/geocode/json', [
                'address' => $location['address'],
                'key' => $googleApiKey,
                'region' => 'my',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if ($data['status'] === 'OK' && !empty($data['results'])) {
                    $geoLocation = $data['results'][0]['geometry']['location'];
                    $coordinates[$location['name']] = [
                        'lat' => $geoLocation['lat'],
                        'lng' => $geoLocation['lng']
                    ];
                    $this->info("  ✓ Found: {$geoLocation['lat']}, {$geoLocation['lng']}");

                    // If this is Mahallah Ruqayyah, log it specially
                    if ($location['name'] === 'Mahallah Ruqayyah') {
                        $this->info("  🎯 MAHALLAH RUQAYYAH COORDINATES: {$geoLocation['lat']}, {$geoLocation['lng']}");
                    }
                } else {
                    $this->error("  ✗ Failed: {$data['status']}");
                    if ($data['status'] === 'ZERO_RESULTS') {
                        $this->warn("  Trying alternative address format...");

                        // Try alternative address format
                        $altResponse = Http::get('https://maps.googleapis.com/maps/api/geocode/json', [
                            'address' => $location['name'] . ', International Islamic University Malaysia, Gombak, Selangor',
                            'key' => $googleApiKey,
                            'region' => 'my',
                        ]);

                        if ($altResponse->successful()) {
                            $altData = $altResponse->json();
                            if ($altData['status'] === 'OK' && !empty($altData['results'])) {
                                $geoLocation = $altData['results'][0]['geometry']['location'];
                                $coordinates[$location['name']] = [
                                    'lat' => $geoLocation['lat'],
                                    'lng' => $geoLocation['lng']
                                ];
                                $this->info("  ✓ Found with alternative: {$geoLocation['lat']}, {$geoLocation['lng']}");
                            }
                        }
                    }
                }
            } else {
                $this->error("  ✗ HTTP Error");
            }

            usleep(200000); // Delay 200ms to avoid rate limiting
        }

        // Save the coordinates
        $configContent = "<?php\n\nreturn " . var_export($coordinates, true) . ";\n";
        file_put_contents(config_path('map_coordinates.php'), $configContent);

        $this->info("\n✅ Done! Saved " . count($coordinates) . " coordinates to config/map_coordinates.php");

        // Display Mahallah Ruqayyah specifically
        if (isset($coordinates['Mahallah Ruqayyah'])) {
            $this->info("\n🎯 MAHALLAH RUQAYYAH FINAL COORDINATES:");
            $this->info("   lat: {$coordinates['Mahallah Ruqayyah']['lat']}");
            $this->info("   lng: {$coordinates['Mahallah Ruqayyah']['lng']}");
        }

        return 0;
    }
}
