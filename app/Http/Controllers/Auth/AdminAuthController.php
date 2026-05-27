<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Admins;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AdminAuthController extends Controller
{
    // ── Show Login Page ───────────────────────────────────
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    // ── Show Register Page ────────────────────────────────
    public function showRegister()
    {
        return Inertia::render('Auth/Register');
    }

    // ── Register ──────────────────────────────────────────
    public function register(Request $request)
    {
        $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['required', 'string', 'email', 'unique:admins,email'],
            'phone'      => ['required', 'string'],
            'password'   => ['required', 'string', 'min:6', 'confirmed'],
            'rank'       => ['required', 'string'],
            'department' => ['required', 'string'],
        ]);

        $admin = Admins::create([
            'name'       => $request->name,
            'email'      => $request->email,
            'phone'      => $request->phone,
            'password'   => Hash::make($request->password),
            'rank'       => $request->rank,
            'department' => $request->department,
            'status'     => 'pending',
        ]);

        return redirect()->route('login')->with([
            'success' => 'Registration submitted! Please wait for admin approval.',
        ]);
    }

    // ── Login ─────────────────────────────────────────────
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Find admin
        $admin = Admins::where('email', $request->email)->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            return back()->withErrors([
                'email' => 'Invalid email or password.',
            ])->onlyInput('email');
        }

        // Check if approved
        if ($admin->status === 'pending') {
            return back()->withErrors([
                'email' => 'Your account is pending admin approval.',
            ])->onlyInput('email');
        }

        if ($admin->status === 'rejected') {
            return back()->withErrors([
                'email' => 'Your account has been rejected. Contact admin.',
            ])->onlyInput('email');
        }

        // Login the user (session-based)
        Auth::login($admin);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    // ── Logout ────────────────────────────────────────────
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    // ── Get current admin ─────────────────────────────────
    public function me()
    {
        return response()->json([
            'admin' => Auth::user(),
        ]);
    }

    // ── Update Admin Status (Approve/Reject) ─────────────────
    public function updateStatus(Request $request, $adminId)
    {
        \Log::info('Update status method called with ID: ' . $adminId);

        $request->validate([
            'status' => 'required|in:pending,approved,rejected',
            'reason' => 'nullable|string'
        ]);

        // Find by '_id' field (MongoDB primary key)
        $admin = Admins::where('_id', $adminId)->first();

        // Also try by 'id' field if not found
        if (!$admin) {
            $admin = Admins::where('id', $adminId)->first();
        }

        if (!$admin) {
            \Log::error('Admin not found with ID: ' . $adminId);
            return redirect()->route('approvals')->with('error', 'Admin not found');
        }

        $oldStatus = $admin->status;
        $newStatus = $request->status;

        $admin->status = $newStatus;

        // Store rejection reason if provided and status is rejected
        if ($newStatus === 'rejected' && $request->has('reason')) {
            $admin->rejection_reason = $request->reason;
        } elseif ($newStatus === 'approved') {
            // Clear rejection reason if approved
            $admin->rejection_reason = null;
        }

        $admin->save();

        $message = match($newStatus) {
            'approved' => 'Admin approved successfully',
            'rejected' => 'Admin request rejected',
            'pending' => 'Admin status changed back to pending',
            default => 'Status updated successfully'
        };

        return redirect()->route('approvals')->with('success', $message);
    }

    // Keep old methods for backward compatibility
    public function approve($adminId)
    {
        return $this->updateStatus(new Request(['status' => 'approved']), $adminId);
    }

    public function reject(Request $request, $adminId)
    {
        return $this->updateStatus(new Request(['status' => 'rejected', 'reason' => $request->reason]), $adminId);
    }

}
