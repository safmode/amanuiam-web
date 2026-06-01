import { useState, useEffect, useCallback } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Map,
  BarChart3,
  Bell,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

export const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { url, props } = usePage();

  const admin = props.auth?.admins;
  const userName = admin?.name || 'Admin';
  const userRole = admin?.rank || 'Security Officer';

  // Get emergency counts from shared props (from HandleInertiaRequests middleware)
  const emergencyCounts = props.emergencyCounts || { active: 0, responding: 0 };

  // Update count when props change
  useEffect(() => {
    const totalActive = (emergencyCounts.active || 0) + (emergencyCounts.responding || 0);
    setActiveAlertCount(totalActive);
  }, [emergencyCounts]);

  // Listen for emergency status changes via custom event
  useEffect(() => {
    const handleEmergencyUpdate = () => {
      console.log('Emergency update detected, refreshing badge...');
      // Use Inertia reload to refresh emergency counts
      router.reload({ only: ['emergencyCounts'] });
    };

    // Listen for custom events
    window.addEventListener('emergency-updated', handleEmergencyUpdate);
    window.addEventListener('emergency-created', handleEmergencyUpdate);
    window.addEventListener('report-created', handleEmergencyUpdate);

    // Also listen for page visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        router.reload({ only: ['emergencyCounts'] });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('emergency-updated', handleEmergencyUpdate);
      window.removeEventListener('emergency-created', handleEmergencyUpdate);
      window.removeEventListener('report-created', handleEmergencyUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Poll for updates every 30 seconds using Inertia reload
  useEffect(() => {
    const interval = setInterval(() => {
      router.reload({ only: ['emergencyCounts'] });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: '/Dashboard', icon: LayoutDashboard, label: 'Dashboard', badgeCount: 0 },
    { path: '/Alerts', icon: Bell, label: 'Emergency Alerts', badgeCount: activeAlertCount },
    { path: '/Reports', icon: FileText, label: 'Reports', badgeCount: 0 },
    { path: '/Heatmap', icon: Map, label: 'Heatmap and Locations', badgeCount: 0 },
    { path: '/Statistics', icon: BarChart3, label: 'Statistics', badgeCount: 0 },
    { path: '/Officers', icon: Users, label: 'Officers', badgeCount: 0 },
    { path: '/Approvals', icon: UserCheck, label: 'Admin Access', badgeCount: 0 },
    { path: '/Settings', icon: Settings, label: 'Settings', badgeCount: 0 },
  ];

  const isActive = (path) => {
    if (path === '/Dashboard') return url === '/Dashboard';
    return url.startsWith(path);
  };

  const handleLogout = () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    // Use Inertia router for logout
    router.post('/logout', {}, {
        onError: (errors) => {
        console.error('Logout error:', errors);
        setIsLoggingOut(false);

        // If CSRF error, force redirect to login
        if (errors && (errors.message?.includes('419') || errors.status === 419)) {
            window.location.href = '/login';
        }
        },
        onSuccess: () => {
        setIsLoggingOut(false);
        },
    });
 };

  const getInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'NA';

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1D1C1C] text-white shadow-lg"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-72 z-40 transition-transform duration-300 flex flex-col',
          'bg-[#1D1C1C]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Section */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shadow-lg overflow-hidden">
            <img src="/images/OSeM.png" alt="IIUM Logo" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Aman@UIAM</h1>
            <p className="text-xs text-gray-400">Security Operations</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-[#D4A84B] text-white shadow-md'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="flex-1">{item.label}</span>

                {/* Animated badge - shows count for active + responding emergencies */}
                {item.badgeCount > 0 && (
                  <span className={cn(
                    'min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse',
                    active
                      ? 'bg-white text-[#D4A84B]'
                      : 'bg-red-500 text-white'
                  )}>
                    {item.badgeCount > 99 ? '99+' : item.badgeCount}
                  </span>
                )}

                {/* Chevron on active page */}
                {active && (
                  <ChevronRight className="w-4 h-4 shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-[#D4A84B] flex items-center justify-center text-white font-bold text-sm">
              {getInitials(userName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-gray-400">{userRole}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={cn(
                "p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors",
                isLoggingOut && "opacity-50 cursor-not-allowed"
              )}
              title="Logout"
            >
              {isLoggingOut ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
