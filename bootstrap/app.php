<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // 🔥 THIS ONE LINE fixes 419 errors for API calls
        $middleware->statefulApi();

        // Your existing web middleware
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Your CSRF exceptions (keep as is)
        $middleware->validateCsrfTokens(except: [
            'api/*',
            'webhook/*',
            'webhook/emergency-alert',
            'digest/send',
            '/telegram/webhook',
            '/telegram/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
