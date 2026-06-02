import { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield, User, Mail, Phone, Save, Moon, Sun, Eye, EyeOff,
  Camera, Loader2, LogOut, Key, Trash2, RefreshCw, Bell, Send, Megaphone
} from 'lucide-react';
import SafetyTips from '@/components/dashboard/SafetyTips';

const Settings = () => {
  const { auth, flash } = usePage().props;
  const admin = auth?.admins;

  // Profile
  const [profile, setProfile] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    phone: admin?.phone || '',
    rank: admin?.rank || '',
    department: admin?.department || '',
  });

  // Password
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [codeError, setCodeError] = useState('');

  // Preferences
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    incidentAlerts: true,
  });
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Helper to get CSRF token
  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  };

  // Load preferences from database using API
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // ✅ FIXED: Use API routes with /api prefix
        const darkModeResponse = await fetch('/api/settings/dark-mode', {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
          },
          credentials: 'same-origin'
        });
        const darkModeData = await darkModeResponse.json();

        const notifResponse = await fetch('/api/settings/notification-preferences', {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
          },
          credentials: 'same-origin'
        });
        const notifData = await notifResponse.json();

        const darkModeValue = darkModeData.dark_mode ?? false;
        setDarkMode(darkModeValue);

        if (darkModeValue) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        setNotifications({
          incidentAlerts: notifData.incident_alerts ?? true,
        });

        localStorage.setItem('darkMode', darkModeValue);
        localStorage.setItem('incidentAlerts', notifData.incident_alerts ?? true);

      } catch (error) {
        console.error('Failed to load preferences:', error);
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedDarkMode);

        const savedIncidentAlerts = localStorage.getItem('incidentAlerts');
        setNotifications({
          incidentAlerts: savedIncidentAlerts !== 'false',
        });

        if (savedDarkMode) {
          document.documentElement.classList.add('dark');
        }
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    loadPreferences();
  }, []);

  // Show toast message from flash
  useEffect(() => {
    if (flash?.success) {
      showToast(flash.success);
    }
    if (flash?.error) {
      showToast(flash.error, 'error');
    }
  }, [flash]);

  // ✅ FIXED: Save dark mode using API with fetch (not Inertia router)
  const handleDarkModeToggle = async (checked) => {
    if (isLoadingPreferences) return;

    // Optimistically update UI
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', checked);

    try {
      const response = await fetch('/api/settings/dark-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ dark_mode: checked }),
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }
    } catch (error) {
      // Revert on error
      const revertMode = !checked;
      setDarkMode(revertMode);
      if (revertMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('darkMode', revertMode);
      showToast('Failed to save preference', 'error');
    }
  };

  // ✅ FIXED: Toggle Incident Alerts using API
  const handleToggleIncidentAlerts = async (checked) => {
    if (isLoadingPreferences) return;

    const previousState = notifications.incidentAlerts;

    // Update UI immediately
    setNotifications(prev => ({ ...prev, incidentAlerts: checked }));
    localStorage.setItem('incidentAlerts', checked);

    try {
      const response = await fetch('/api/settings/notification-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ incident_alerts: checked }),
        credentials: 'same-origin'
      });

      const data = await response.json();

      if (data.success) {
        showToast('Notification preference saved');
        window.dispatchEvent(new CustomEvent('notification-preference-changed', {
          detail: { enabled: checked }
        }));
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      // Revert on error
      setNotifications(prev => ({ ...prev, incidentAlerts: previousState }));
      localStorage.setItem('incidentAlerts', previousState);
      showToast('Failed to save preference', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${
      type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    toast.innerHTML = `<div class="flex items-center gap-2">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}<span>${message}</span></div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const getInitials = () => {
    const name = profile.name || admin?.name || 'User';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        localStorage.setItem('userAvatar', reader.result);
        showToast('Avatar updated successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ FIXED: Save Profile using API
  const handleSaveProfile = async () => {
    if (!profile.name || !profile.email) {
      showToast('Name and email are required', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify(profile),
        credentials: 'same-origin'
      });

      if (response.ok) {
        showToast('Profile updated successfully');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Update failed');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED: Send Digest using API
  const handleSendDigest = async (type) => {
    setSendingDigest(type);

    try {
      const response = await fetch('/api/digest/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ type }),
        credentials: 'same-origin'
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} digest sent to your email`);
      } else {
        throw new Error(data.message || 'Failed to send digest');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSendingDigest(null);
    }
  };

  // ✅ FIXED: Change Password Functions using API
  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (passwordData.new_password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (!passwordData.current_password) {
      showToast('Current password is required', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/password/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
          new_password_confirmation: passwordData.new_password_confirmation
        }),
        credentials: 'same-origin'
      });

      setIsLoading(false);

      if (response.ok) {
        setShowCodeModal(true);
        setResendTimer(60);
        startResendTimer();
        showToast('Verification code sent to your email');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send verification code');
      }
    } catch (error) {
      setIsLoading(false);
      showToast(error.message, 'error');
    }
  };

  const startResendTimer = () => {
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setCodeError('Please enter the 6-digit verification code');
      return;
    }

    setCodeError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/password/verify-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ code: verificationCode }),
        credentials: 'same-origin'
      });

      setIsLoading(false);

      if (response.ok) {
        setShowCodeModal(false);
        setVerificationCode('');
        setPasswordData({ current_password: '', new_password: '', new_password_confirmation: '' });
        showToast('Password changed successfully');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Invalid verification code');
      }
    } catch (error) {
      setIsLoading(false);
      setCodeError(error.message);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    try {
      await fetch('/api/password/resend-code', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        credentials: 'same-origin'
      });

      setResendTimer(60);
      startResendTimer();
      showToast('New verification code sent to your email');
    } catch (error) {
      showToast('Failed to resend code', 'error');
    }
  };

  // ✅ FIXED: Logout from all devices using API
  const handleLogoutAllDevices = async () => {
    if (confirm('This will log you out from all devices. You will need to login again. Continue?')) {
      setIsLoading(true);

      try {
        await fetch('/api/logout-all', {
          method: 'POST',
          headers: {
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
          },
          credentials: 'same-origin'
        });

        window.location.href = '/';
      } catch (error) {
        setIsLoading(false);
        showToast('Failed to logout from all devices', 'error');
      }
    }
  };

  // ✅ FIXED: Reset all settings using API
  const handleResetAll = async () => {
    if (confirm('Reset all settings to default? This cannot be undone.')) {
      localStorage.removeItem('darkMode');
      localStorage.removeItem('weeklyDigest');
      localStorage.removeItem('monthlyDigest');
      localStorage.removeItem('incidentAlerts');
      localStorage.removeItem('userAvatar');

      setDarkMode(false);
      setNotifications({
        incidentAlerts: true,
      });
      setAvatarPreview(null);

      document.documentElement.classList.remove('dark');

      try {
        await fetch('/api/settings/dark-mode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({ dark_mode: false }),
          credentials: 'same-origin'
        });

        await fetch('/api/settings/notification-preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({ incident_alerts: true }),
          credentials: 'same-origin'
        });

        showToast('All settings reset to default');
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        showToast('Failed to reset settings', 'error');
      }
    }
  };

  // Show loading while fetching preferences
  if (isLoadingPreferences) {
    return (
      <DashboardLayout title="Settings" subtitle="Manage your account preferences">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4A853]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account preferences">
      {/* Rest of your JSX remains exactly the same */}
      <Tabs defaultValue="profile" className="w-full">
        {/* ... all your existing JSX ... */}
      </Tabs>
    </DashboardLayout>
  );
};

export default Settings;
