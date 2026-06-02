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

  // Load preferences - NO /api prefix
  useEffect(() => {
    const loadPreferences = async () => {
      if (!admin) {
        setIsLoadingPreferences(false);
        return;
      }

      try {
        const darkModeResponse = await fetch('/settings/dark-mode', {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
          },
          credentials: 'same-origin'
        });

        if (darkModeResponse.ok) {
          const darkModeData = await darkModeResponse.json();
          const darkModeValue = darkModeData.dark_mode ?? false;
          setDarkMode(darkModeValue);
          if (darkModeValue) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          localStorage.setItem('darkMode', darkModeValue);
        }

        const notifResponse = await fetch('/settings/notification-preferences', {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
          },
          credentials: 'same-origin'
        });

        if (notifResponse.ok) {
          const notifData = await notifResponse.json();
          setNotifications({
            incidentAlerts: notifData.incident_alerts ?? true,
          });
          localStorage.setItem('incidentAlerts', notifData.incident_alerts ?? true);
        }

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
  }, [admin]);

  // Show toast message from flash
  useEffect(() => {
    if (flash?.success) {
      showToast(flash.success);
    }
    if (flash?.error) {
      showToast(flash.error, 'error');
    }
  }, [flash]);

  // Save dark mode - NO /api prefix
  const handleDarkModeToggle = async (checked) => {
    if (isLoadingPreferences) return;

    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
        throw new Error('Failed to save');
      }
    } catch (error) {
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

  // Toggle Incident Alerts - NO /api prefix
  const handleToggleIncidentAlerts = async (checked) => {
    if (isLoadingPreferences) return;

    const previousState = notifications.incidentAlerts;

    setNotifications(prev => ({ ...prev, incidentAlerts: checked }));
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

  // Save Profile - NO /api prefix
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

  // Send Digest - NO /api prefix
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

  // Change Password - NO /api prefix
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

  // Logout from all devices - NO /api prefix
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

  // Reset all settings - NO /api prefix
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

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="rounded-2xl border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4A853] to-[#B8923F] flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials()
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <Button size="icon" variant="secondary" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full dark:bg-slate-700 dark:hover:bg-slate-600" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">{profile.name || admin?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{profile.rank || admin?.rank || 'Security Officer'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Full Name</Label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                    className="mt-1 h-10 bg-white border-border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                      className="pl-10 h-10 bg-white border-border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Phone Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                      className="pl-10 h-10 bg-white border-border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Rank</Label>
                  <Select
                    value={profile.rank}
                    onValueChange={(value) => setProfile(p => ({ ...p, rank: value }))}
                  >
                    <SelectTrigger className="mt-1 h-10 bg-white border-border rounded-xl text-sm text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200">
                      <SelectValue placeholder="Select rank" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800 dark:border-slate-700">
                      <SelectItem value="Senior Security Officer" className="text-gray-900 dark:text-gray-300">Senior Security Officer</SelectItem>
                      <SelectItem value="Security Officer" className="text-gray-900 dark:text-gray-300">Security Officer</SelectItem>
                      <SelectItem value="Junior Officer" className="text-gray-900 dark:text-gray-300">Junior Officer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Department</Label>
                  <Select
                    value={profile.department}
                    onValueChange={(value) => setProfile(p => ({ ...p, department: value }))}
                  >
                    <SelectTrigger className="mt-1 h-10 bg-white border-border rounded-xl text-sm text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800 dark:border-slate-700">
                      <SelectItem value="Operations" className="text-gray-900 dark:text-gray-300">Operations</SelectItem>
                      <SelectItem value="URB Unit" className="text-gray-900 dark:text-gray-300">URB Unit</SelectItem>
                      <SelectItem value="Patrol Unit" className="text-gray-900 dark:text-gray-300">Patrol Unit</SelectItem>
                      <SelectItem value="Operations Room" className="text-gray-900 dark:text-gray-300">Operations Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="mt-4 gap-2 bg-[#D4A853] hover:bg-[#C49A48] rounded-xl w-full text-white"
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="rounded-2xl border-0 shadow-sm dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Key className="w-5 h-5 text-[#D4A853]" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Change Password</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Current Password"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData(p => ({ ...p, current_password: e.target.value }))}
                        className="pr-10 h-10 bg-white border-border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                      />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 dark:hover:bg-slate-700"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="New Password (min 6 characters)"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData(p => ({ ...p, new_password: e.target.value }))}
                        className="pr-10 h-10 bg-white border-border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                      />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 dark:hover:bg-slate-700"
                        onClick={() => setShowNewPassword(!showNewPassword)}>
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm New Password"
                        value={passwordData.new_password_confirmation}
                        onChange={(e) => setPasswordData(p => ({ ...p, new_password_confirmation: e.target.value }))}
                        className="pr-10 h-10 bg-white border-border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                      />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 dark:hover:bg-slate-700"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button className="bg-[#D4A853] hover:bg-[#C49A48] rounded-xl w-full text-white" onClick={handleChangePassword} disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Update Password
                    </Button>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LogOut className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Active Sessions</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Log out from all devices</p>
                      </div>
                    </div>
                    <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30" onClick={handleLogoutAllDevices} disabled={isLoading}>
                      <RefreshCw className="w-4 h-4 mr-2" />Logout All
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendDigest('weekly')}
                      disabled={sendingDigest === 'weekly'}
                      className="rounded-lg gap-2"
                    >
                      {sendingDigest === 'weekly' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send Weekly
                    </Button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Monthly Digest</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive monthly performance report</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendDigest('monthly')}
                      disabled={sendingDigest === 'monthly'}
                      className="rounded-lg gap-2"
                    >
                      {sendingDigest === 'monthly' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send Monthly
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

      {/* Password Change Verification Modal */}
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
                    onChange={(e) => {
                      setVerificationCode(e.target.value);
                      setCodeError('');
                    }}
                    className="mt-1 text-center text-xl tracking-widest"
                    autoFocus
                  />
                  {codeError && <p className="text-xs text-red-600 mt-1">{codeError}</p>}
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#D4A853] hover:bg-[#C49A48] text-white" onClick={handleVerifyCode} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Change Password'}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowCodeModal(false);
                    setVerificationCode('');
                    setCodeError('');
                  }}>Cancel</Button>
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
