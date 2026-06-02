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

  const [profile, setProfile] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    phone: admin?.phone || '',
    rank: admin?.rank || '',
    department: admin?.department || '',
  });

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

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({ incidentAlerts: true });
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  };

  // Load preferences (GET requests with fetch)
  useEffect(() => {
    const loadPreferences = async () => {
      if (!admin) {
        setIsLoadingPreferences(false);
        return;
      }

      try {
        // Dark mode
        const darkModeResponse = await fetch('/settings/dark-mode', {
          headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
          credentials: 'same-origin'
        });
        if (darkModeResponse.ok) {
          const darkModeData = await darkModeResponse.json();
          const darkModeValue = darkModeData.dark_mode ?? false;
          setDarkMode(darkModeValue);
          if (darkModeValue) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
          localStorage.setItem('darkMode', darkModeValue);
        }

        // Notification preferences
        const notifResponse = await fetch('/settings/notification-preferences', {
          headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
          credentials: 'same-origin'
        });
        if (notifResponse.ok) {
          const notifData = await notifResponse.json();
          setNotifications({ incidentAlerts: notifData.incident_alerts ?? true });
          localStorage.setItem('incidentAlerts', notifData.incident_alerts ?? true);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedDarkMode);
        setNotifications({ incidentAlerts: localStorage.getItem('incidentAlerts') !== 'false' });
        if (savedDarkMode) document.documentElement.classList.add('dark');
      } finally {
        setIsLoadingPreferences(false);
      }
    };
    loadPreferences();
  }, [admin]);

  useEffect(() => {
    if (flash?.success) showToast(flash.success);
    if (flash?.error) showToast(flash.error, 'error');
  }, [flash]);

  // ============================================
  // DARK MODE TOGGLE – fetch with CSRF token (original)
  // ============================================
  const handleDarkModeToggle = async (checked) => {
    if (isLoadingPreferences) return;

    // Optimistic update
    setDarkMode(checked);
    if (checked) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', checked);

    try {
      const response = await fetch('/settings/dark-mode', {
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
        throw new Error('Failed to save dark mode preference');
      }
    } catch (error) {
      // Revert on error
      const revertMode = !checked;
      setDarkMode(revertMode);
      if (revertMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', revertMode);
      showToast('Failed to save preference', 'error');
    }
  };

  // ============================================
  // INCIDENT ALERTS TOGGLE – fetch with CSRF token (same as dark mode)
  // ============================================
  const handleToggleIncidentAlerts = async (checked) => {
    if (isLoadingPreferences) return;

    const previousState = notifications.incidentAlerts;
    setNotifications({ incidentAlerts: checked });
    localStorage.setItem('incidentAlerts', checked);

    try {
      const response = await fetch('/settings/notification-preferences', {
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
      setNotifications({ incidentAlerts: previousState });
      localStorage.setItem('incidentAlerts', previousState);
      showToast('Failed to save preference', 'error');
    }
  };

  // ------------------------------------------------------------
  // All other handlers (identical to your original)
  // ------------------------------------------------------------
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

  const handleSaveProfile = async () => {
    if (!profile.name || !profile.email) {
      showToast('Name and email are required', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/settings/profile', {
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
      if (response.ok) showToast('Profile updated successfully');
      else throw new Error('Update failed');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendDigest = async (type) => {
    setSendingDigest(type);
    try {
      const response = await fetch('/digest/send', {
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
      if (response.ok) showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} digest sent to your email`);
      else throw new Error(data.message || 'Failed to send digest');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSendingDigest(null);
    }
  };

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
      const response = await fetch('/password/send-code', {
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
        if (prev <= 1) { clearInterval(timer); return 0; }
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
      const response = await fetch('/password/verify-change', {
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
      await fetch('/password/resend-code', {
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

  const handleLogoutAllDevices = async () => {
    if (confirm('This will log you out from all devices. You will need to login again. Continue?')) {
      setIsLoading(true);
      try {
        await fetch('/logout-all', {
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

  const handleResetAll = async () => {
    if (confirm('Reset all settings to default? This cannot be undone.')) {
      localStorage.removeItem('darkMode');
      localStorage.removeItem('weeklyDigest');
      localStorage.removeItem('monthlyDigest');
      localStorage.removeItem('incidentAlerts');
      localStorage.removeItem('userAvatar');
      setDarkMode(false);
      setNotifications({ incidentAlerts: true });
      setAvatarPreview(null);
      document.documentElement.classList.remove('dark');
      try {
        await fetch('/settings/dark-mode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({ dark_mode: false }),
          credentials: 'same-origin'
        });
        await fetch('/settings/notification-preferences', {
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
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-transparent border-0 mb-6 p-0 w-full">
          <div className="grid grid-cols-4 gap-2 w-full">
            <TabsTrigger value="profile" className="gap-2 rounded-lg data-[state=active]:bg-[#D4A853]/10 data-[state=active]:text-[#D4A853] py-2 text-gray-700 dark:text-gray-300 dark:data-[state=active]:text-[#D4A853]">
              <User className="w-4 h-4" />Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 rounded-lg data-[state=active]:bg-[#D4A853]/10 data-[state=active]:text-[#D4A853] py-2 text-gray-700 dark:text-gray-300 dark:data-[state=active]:text-[#D4A853]">
              <Shield className="w-4 h-4" />Security
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2 rounded-lg data-[state=active]:bg-[#D4A853]/10 data-[state=active]:text-[#D4A853] py-2 text-gray-700 dark:text-gray-300 dark:data-[state=active]:text-[#D4A853]">
              <Bell className="w-4 h-4" />Preferences
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="gap-2 rounded-lg data-[state=active]:bg-[#D4A853]/10 data-[state=active]:text-[#D4A853] py-2 text-gray-700 dark:text-gray-300 dark:data-[state=active]:text-[#D4A853]">
              <Megaphone className="w-4 h-4" />Broadcast
            </TabsTrigger>
          </div>
        </TabsList>

        {/* Profile Tab – identical to original, omitted for brevity but you can copy from your working file */}
        <TabsContent value="profile">
          <Card className="rounded-2xl border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="p-6">
              {/* ... your existing profile form JSX ... */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab – same as original */}
        <TabsContent value="security">
          {/* ... your existing security JSX ... */}
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <div className="space-y-6">
            <Card className="rounded-2xl border-0 shadow-sm dark:bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#D4A853]/10 flex items-center justify-center">
                    <Sun className="w-4 h-4 text-[#D4A853]" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Appearance</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      {darkMode ? <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" /> : <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Dark Mode</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
                      </div>
                    </div>
                    <Switch checked={darkMode} onCheckedChange={handleDarkModeToggle} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm dark:bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#D4A853]/10 flex items-center justify-center">
                    <Send className="w-4 h-4 text-[#D4A853]" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Email Digests</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Weekly Digest</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive a summary of weekly activities</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleSendDigest('weekly')} disabled={sendingDigest === 'weekly'} className="rounded-lg gap-2">
                      {sendingDigest === 'weekly' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Weekly
                    </Button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Monthly Digest</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive monthly performance report</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleSendDigest('monthly')} disabled={sendingDigest === 'monthly'} className="rounded-lg gap-2">
                      {sendingDigest === 'monthly' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Monthly
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm dark:bg-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#D4A853]/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-[#D4A853]" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Real-time Alerts</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Incident Alerts</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about new incidents</p>
                    </div>
                    <Switch checked={notifications.incidentAlerts} onCheckedChange={handleToggleIncidentAlerts} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-red-200 shadow-sm dark:border-red-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center dark:bg-red-900/30">
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium text-red-600 dark:text-red-400">Reset All Settings</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Restore all settings to default values</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30" onClick={handleResetAll}>
                    <Trash2 className="w-4 h-4 mr-2" />Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Broadcast Tab */}
        <TabsContent value="broadcast">
          <SafetyTips />
        </TabsContent>
      </Tabs>

      {/* Password Change Verification Modal – unchanged */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[400px] max-w-[90vw] dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Verify Your Email</h3>
              <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
                We've sent a 6-digit verification code to your email.
              </p>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Verification Code</Label>
                  <Input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => { setVerificationCode(e.target.value); setCodeError(''); }}
                    className="mt-1 text-center text-xl tracking-widest"
                    autoFocus
                  />
                  {codeError && <p className="text-xs text-red-600 mt-1">{codeError}</p>}
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#D4A853] hover:bg-[#C49A48] text-white" onClick={handleVerifyCode} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Change Password'}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowCodeModal(false); setVerificationCode(''); setCodeError(''); }}>Cancel</Button>
                </div>
                <div className="text-center">
                  <Button variant="link" size="sm" onClick={handleResendCode} disabled={resendTimer > 0}>
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend verification code'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Settings;
