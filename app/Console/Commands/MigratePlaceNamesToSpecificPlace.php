<?php

namespace App\Console\Commands;

use App\Models\Report;
use Illuminate\Console\Command;

class MigratePlaceNamesToSpecificPlace extends Command
{
    protected $signature = 'reports:migrate-place-names';
    protected $description = 'Migrate place names from locationArea to specificPlace';

    public function handle()
    {
        $placeNames = ['7 Eleven', 'Office', 'Cafe', 'Cafeteria', 'Library', 'Gym', 'Store', 'Shop', 'Restaurant', 'Food Court'];

        $reports = Report::all();
        $count = 0;

        foreach ($reports as $report) {
            $location = $report->location;
            $updated = false;

            if (is_array($location)) {
                // Check if locationArea contains a place name
                if (isset($location['locationArea']) && !isset($location['specificPlace'])) {
                    $locationArea = $location['locationArea'];

                    foreach ($placeNames as $place) {
                        if (stripos($locationArea, $place) !== false) {
                            // Move to specificPlace
                            $location['specificPlace'] = $locationArea;
                            $location['locationArea'] = ''; // Clear locationArea
                            $updated = true;

                            $this->info("Migrated report {$report->reportId}: '{$locationArea}' → specificPlace");
                            $count++;
                            break;
                        }
                    }
                }

                if ($updated) {
                    $report->location = $location;
                    $report->save();
                }
            }
        }

        $this->info("Migrated {$count} reports");
    }
}
