<?php

return [
    // config/broadcasting.php
    'connections' => [
        'pusher' => [
            'driver' => 'pusher',
            'key' => env('PUSHER_APP_KEY'),
            'secret' => env('PUSHER_APP_SECRET'),
            'app_id' => env('PUSHER_APP_ID'),
            'options' => [
                'cluster' => env('PUSHER_APP_CLUSTER'),
                'host' => 'api-' . env('PUSHER_APP_CLUSTER') . '.pusher.com',
                'port' => 443,
                'scheme' => 'https',
                'useTLS' => true,
            ],
            'client_options' => [],
        ],
    ],
];
