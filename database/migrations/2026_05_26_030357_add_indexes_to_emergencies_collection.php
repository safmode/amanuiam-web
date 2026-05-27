<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class AddIndexesToEmergenciesCollection extends Migration
{
    public function up()
    {
        $collection = DB::connection('mongodb')->getCollection('emergencies');

        // Add indexes for frequently queried fields
        $collection->createIndex(['status' => 1]);
        $collection->createIndex(['triggeredAt' => -1]);
        $collection->createIndex(['status' => 1, 'triggeredAt' => -1]);
        $collection->createIndex(['studentId' => 1]);
        $collection->createIndex(['assigned_officer_id' => 1]);
    }

    public function down()
    {
        $collection = DB::connection('mongodb')->getCollection('emergencies');

        $collection->dropIndex('status_1');
        $collection->dropIndex('triggeredAt_-1');
        $collection->dropIndex('status_1_triggeredAt_-1');
        $collection->dropIndex('studentId_1');
        $collection->dropIndex('assigned_officer_id_1');
    }
}
