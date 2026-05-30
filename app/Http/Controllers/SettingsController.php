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
        // Store two-factor preference
        $admin = Auth::user();
        $admin->two_factor_enabled = $request->enabled;
        $admin->save();

        return response()->json(['success' => true]);
    }

    /**
     * Logout from all devices (invalidate all sessions/tokens)
     */
    public function logoutAllDevices(Request $request)
    {
        try {
            $admin = Auth::user();

            // For Laravel Sanctum (if using API tokens)
            if (method_exists($admin, 'tokens')) {
                $admin->tokens()->delete();
            }

            // For session-based logout
            // This will invalidate all sessions for this user
            $admin->forceFill([
                'remember_token' => null,
            ])->save();

            // Also clear any other session data
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

            return response()->json([
                'success' => true,
                'message' => 'Logged out from all devices successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to logout from all devices: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to logout from all devices: ' . $e->getMessage()
            ], 500);
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

        // Merge with existing preferences or create new
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

        return response()->json([
            'success' => true,
            'message' => 'Notification preferences updated successfully'
        ]);
    }

    /**
     * Get notification preferences for the authenticated admin
     */
    public function getNotificationPreferences(Request $request)
    {
        $admin = Auth::user();
        $preferences = $admin->notification_preferences ?? [];

        return response()->json([
            'incident_alerts' => $preferences['incident_alerts'] ?? true,
        ]);
    }

    // ============================================================
    // Dark Mode Preference
    // ============================================================

    /**
     * Update dark mode preference for the authenticated admin
     */
    public function updateDarkMode(Request $request)
    {
        \Log::info('Dark mode update called', ['request_data' => $request->all()]);

        $admin = Auth::user();

        $validated = $request->validate([
            'dark_mode' => 'required|boolean',
        ]);

        $currentPreferences = $admin->notification_preferences ?? [];
        $admin->notification_preferences = array_merge($currentPreferences, [
            'dark_mode' => $validated['dark_mode'],
        ]);
        $admin->save();

        \Log::info('Dark mode saved', ['new_value' => $validated['dark_mode']]);

        return response()->json([
            'success' => true,
            'message' => 'Dark mode preference updated successfully',
            'dark_mode' => $validated['dark_mode']
        ]);
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
