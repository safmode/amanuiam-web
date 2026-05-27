<?php
// app/Http/Controllers/PasswordChangeController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class PasswordChangeController extends Controller
{
    // Step 1: Send verification code
    public function sendCode(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:6|confirmed',
        ]);

        $user = Auth::user();

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 422);
        }

        // Generate 6-digit code
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store code in database
        $user->password_reset_code = $code;
        $user->password_reset_code_expires_at = now()->addMinutes(10);
        $user->save();

        // Store new password temporarily in session
        session(['temp_new_password' => $request->new_password]);

        // Send email
        try {
            Mail::send('emails.password-code', [
                'code' => $code,
                'name' => $user->name
            ], function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('Password Change Verification Code');
            });

            return response()->json([
                'success' => true,
                'message' => 'Verification code sent to your email'
            ]);
        } catch (\Exception $e) {
            Log::error('Mail error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to send email. Please check your mail configuration.'
            ], 500);
        }
    }

    // Step 2: Verify code and change password
    public function verifyAndChange(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = Auth::user();

        // Check code
        if (!$user->password_reset_code || $user->password_reset_code !== $request->code) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification code'
            ], 422);
        }

        // Check expiration
        if (now()->gt($user->password_reset_code_expires_at)) {
            return response()->json([
                'success' => false,
                'message' => 'Verification code has expired. Please try again.'
            ], 422);
        }

        // Get new password from session
        $newPassword = session('temp_new_password');

        if (!$newPassword) {
            return response()->json([
                'success' => false,
                'message' => 'Session expired. Please try again.'
            ], 422);
        }

        // Change password
        $user->password = Hash::make($newPassword);
        $user->password_reset_code = null;
        $user->password_reset_code_expires_at = null;
        $user->save();

        // Clear session
        session()->forget('temp_new_password');

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    }

    // Resend code
    public function resendCode(Request $request)
    {
        $user = Auth::user();

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->password_reset_code = $code;
        $user->password_reset_code_expires_at = now()->addMinutes(10);
        $user->save();

        try {
            Mail::send('emails.password-code', [
                'code' => $code,
                'name' => $user->name
            ], function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('Password Change Verification Code');
            });

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Resend mail error: ' . $e->getMessage());
            return response()->json(['success' => false], 500);
        }
    }
}
