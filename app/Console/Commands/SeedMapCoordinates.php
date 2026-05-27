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
            'Mahallah Asiah', 'Mahallah Aminah', 'Mahallah Safiyyah', 'Mahallah Maryam',
            'Mahallah Ruqayyah', 'Mahallah Ali', 'Mahallah Faruq', 'Mahallah Bilal',
            'Mahallah Asma', 'Mahallah Hafsah', 'Mahallah Halimah', 'Mahallah Siddiq',
            'Mahallah Salahuddin', 'Mahallah Uthman', 'Mahallah Nusaibah',
            'Mahallah Zubair Al-Awwam', 'Mahallah Sumayyah',
            'KIRKHS (AHAS KIRKHS)', 'KICT (ICT)', 'KOE (Engineering)', 'KAED (Architecture)',
            'KENMS (Economics)', 'AIKOL (Law)', 'KOED (Education)', 'Dar al-Hikmah Library',
            'Female Sports Complex', 'Saidina Hamzah Stadium', 'IIUM Archery Range',
            'UIA Football Turf', 'IIUM Cricket Ground', 'IIUM Rugby Field',
            'Padang Kawad UIAM', 'IIUM Educare'
        ];

        $coordinates = [];

        foreach ($mainLocations as $locationName) {
            if (strpos(strtolower($locationName), 'mahallah') !== false) {
                $address = $locationName . ', IIUM Gombak, Selangor, Malaysia';
            } elseif (strpos(strtolower($locationName), 'kirkhs') !== false ||
                      strpos(strtolower($locationName), 'kict') !== false ||
                      strpos(strtolower($locationName), 'koe') !== false ||
                      strpos(strtolower($locationName), 'kaed') !== false ||
                      strpos(strtolower($locationName), 'kenms') !== false ||
                      strpos(strtolower($locationName), 'aikol') !== false ||
                      strpos(strtolower($locationName), 'koed') !== false) {
                $address = $locationName . ', IIUM Gombak, Selangor, Malaysia';
            } elseif (strpos(strtolower($locationName), 'library') !== false) {
                $address = 'Dar al-Hikmah Library, IIUM Gombak, Selangor, Malaysia';
            } elseif (strpos(strtolower($locationName), 'stadium') !== false) {
                $address = 'Saidina Hamzah Stadium, IIUM Gombak, Selangor, Malaysia';
            } else {
                $address = $locationName . ', IIUM Gombak, Selangor, Malaysia';
            }

            $this->info("Geocoding: {$locationName}...");

            $response = Http::get('https://maps.googleapis.com/maps/api/geocode/json', [
                'address' => $address,
                'key' => $googleApiKey,
                'region' => 'my',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if ($data['status'] === 'OK' && !empty($data['results'])) {
                    $location = $data['results'][0]['geometry']['location'];
                    $coordinates[$locationName] = [
                        'lat' => $location['lat'],
                        'lng' => $location['lng']
                    ];
                    $this->info("  ✓ Found: {$location['lat']}, {$location['lng']}");
                } else {
                    $this->error("  ✗ Failed: {$data['status']}");
                }
            } else {
                $this->error("  ✗ HTTP Error");
            }

            usleep(100000); // Delay to avoid rate limiting
        }

        $configContent = "<?php\n\nreturn " . var_export($coordinates, true) . ";\n";
        file_put_contents(config_path('map_coordinates.php'), $configContent);

        $this->info("\n✅ Done! Saved " . count($coordinates) . " coordinates to config/map_coordinates.php");

        return 0;
    }
}
