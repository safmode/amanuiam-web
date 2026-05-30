<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class SettingsController extends Controller
{
    public function updateProfile(Request $request)
    {
        $admin = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:admins,email,' . $admin->id,
            'phone' => 'nullable|string|max:20',
            'rank' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
        ]);

        $admin->update($validated);

        return redirect()->back()->with('success', 'Profile updated successfully.');
    }

    public function changePassword(Request $request)
    {
        $admin = Auth::user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $admin->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $admin->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return redirect()->back()->with('success', 'Password changed successfully.');
    }

    public function toggleTwoFactor(Request $request)
    {
        $admin = Auth::user();
        $admin->two_factor_enabled = $request->enabled;
        $admin->save();

        return redirect()->back()->with('success', 'Two-factor authentication updated');
    }

    /**
     * Logout from all devices (invalidate all sessions/tokens)
     */
    public function logoutAllDevices(Request $request)
    {
        try {
            $admin = Auth::user();

            if (method_exists($admin, 'tokens')) {
                $admin->tokens()->delete();
            }

            $admin->forceFill([
                'remember_token' => null,
            ])->save();

            $guards = array_keys(config('auth.guards'));
            foreach ($guards as $guard) {
                if (Auth::guard($guard)->check() && Auth::guard($guard)->id() == $admin->id) {
                    Auth::guard($guard)->logout();
                }
            }

            Log::info('User logged out from all devices', [
                'admin_id' => (string)$admin->_id,
                'admin_email' => $admin->email
            ]);

            return redirect('/')->with('success', 'Logged out from all devices successfully');

        } catch (\Exception $e) {
            Log::error('Failed to logout from all devices: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to logout from all devices: ' . $e->getMessage());
        }
    }

    /**
     * Update notification preferences for the authenticated admin
     */
    public function updateNotificationPreferences(Request $request)
    {
        $admin = Auth::user();

        $validated = $request->validate([
            'incident_alerts' => 'required|boolean',
        ]);

        $currentPreferences = $admin->notification_preferences ?? [];
        $admin->notification_preferences = array_merge($currentPreferences, [
            'incident_alerts' => $validated['incident_alerts'],
        ]);
        $admin->save();

        Log::info('Notification preferences updated', [
            'admin_id' => (string)$admin->_id,
            'admin_email' => $admin->email,
            'preferences' => $admin->notification_preferences
        ]);

        // ✅ FIXED: Return redirect for Inertia
        return redirect()->back()->with('success', 'Notification preferences updated successfully');
    }

    /**
     * Get notification preferences for the authenticated admin
     */
    public function getNotificationPreferences(Request $request)
    {
        $admin = Auth::user();
        $preferences = $admin->notification_preferences ?? [];

        // For GET requests, JSON is fine
        return response()->json([
            'incident_alerts' => $preferences['incident_alerts'] ?? true,
        ]);
    }

    // ============================================================
    // Dark Mode Preference
    // ============================================================

    public function updateDarkMode(Request $request)
    {
        $admin = Auth::user();

        $validated = $request->validate([
            'dark_mode' => 'required|boolean',
        ]);

        $currentPreferences = $admin->notification_preferences ?? [];
        $admin->notification_preferences = array_merge($currentPreferences, [
            'dark_mode' => $validated['dark_mode'],
        ]);
        $admin->save();

        // ✅ FIXED: Return redirect for Inertia
        return redirect()->back()->with('success', 'Dark mode preference updated successfully');
    }

    /**
     * Get dark mode preference for the authenticated admin
     */
    public function getDarkMode(Request $request)
    {
        $admin = Auth::user();
        $preferences = $admin->notification_preferences ?? [];

        return response()->json([
            'dark_mode' => $preferences['dark_mode'] ?? false,
        ]);
    }
}
