<?php
// database/migrations/xxxx_add_telegram_fields_to_officers.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::connection('mongodb')->table('officers', function ($collection) {
            $collection->string('telegram_chat_id')->nullable();
            $collection->boolean('receive_emergency')->default(true);
            $collection->boolean('receive_daily_digest')->default(false);
        });
    }

    public function down()
    {
        Schema::connection('mongodb')->table('officers', function ($collection) {
            $collection->dropColumn(['telegram_chat_id', 'receive_emergency', 'receive_daily_digest']);
        });
    }
};
