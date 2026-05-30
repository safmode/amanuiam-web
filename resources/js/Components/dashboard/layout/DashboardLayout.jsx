import { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardLayout = ({ children, title, subtitle }) => {
  const { darkMode: serverDarkMode } = usePage().props;
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load dark mode preference from server props
  useEffect(() => {
    // Get dark mode from server props or fallback to localStorage
    const isDark = serverDarkMode ?? localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setIsLoading(false);
  }, [serverDarkMode]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;

    // Update UI immediately (optimistic)
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save to localStorage (backup)
    localStorage.setItem('darkMode', newDarkMode);

    // Use Inertia router - CSRF handled automatically!
    router.post('/settings/dark-mode', {
      dark_mode: newDarkMode
    }, {
      preserveScroll: true,
      preserveState: true,
      onError: () => {
        // Revert on error
        const revertMode = !newDarkMode;
        setDarkMode(revertMode);
        if (revertMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', revertMode);
        console.error('Failed to save dark mode preference');
      }
    });
  };

  // Show loading state while fetching preference
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A853]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-900">
      <Sidebar />

      <div className="lg:pl-72">
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

        <main className="relative">
          {(title || subtitle) && (
            <div className="px-6 pt-6 pb-2">
              {title && (
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          )}

          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
