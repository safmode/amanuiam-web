import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import axios from 'axios';

export const DashboardLayout = ({ children, title, subtitle }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load dark mode preference from database on mount
  useEffect(() => {
    const loadDarkMode = async () => {
      try {
        const response = await axios.get('/settings/dark-mode', {
          headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content }
        });

        if (response.data && typeof response.data.dark_mode !== 'undefined') {
          const isDark = response.data.dark_mode;
          setDarkMode(isDark);

          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem('darkMode');
          const isDark = saved === 'true';
          setDarkMode(isDark);
          if (isDark) {
            document.documentElement.classList.add('dark');
          }
        }
      } catch (error) {
        console.error('Failed to load dark mode preference:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('darkMode');
        const isDark = saved === 'true';
        setDarkMode(isDark);
        if (isDark) {
          document.documentElement.classList.add('dark');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDarkMode();
  }, []);

  const toggleDarkMode = async () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    // Apply to DOM immediately
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save to localStorage (backup)
    localStorage.setItem('darkMode', newDarkMode);

    // Save to database
    try {
      await axios.post('/settings/dark-mode', {
        dark_mode: newDarkMode
      }, {
        headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content }
      });
    } catch (error) {
      console.error('Failed to save dark mode preference:', error);
    }
  };

  // Optional: Show loading state while fetching preference
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
