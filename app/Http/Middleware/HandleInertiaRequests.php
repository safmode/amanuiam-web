<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return array_merge(parent::share($request), [
            'auth' => [
                'admins' => $user ? [
                    'id' => $user->_id ?? $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone ?? '',
                    'rank' => $user->rank,
                    'department' => $user->department,
                    'status' => $user->status,
                    'role' => $user->role ?? 'admin',
                ] : null,
            ],
        ]);
    }
}
