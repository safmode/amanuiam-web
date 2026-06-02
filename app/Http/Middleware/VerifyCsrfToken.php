<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    protected $except = [
        'webhook/*',
        'webhook/new-report',
        '/telegram/webhook',
        // 'api/emergencies',
        // 'api/emergencies/*',
        // 'digest/send',
        'api/ai/analyze-report',
        // '*',
    ];
}
