import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardLayout = ({ children, title, subtitle }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to get CSRF token
  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  };

  // Load dark mode preference from database on mount
  useEffect(() => {
    const loadDarkMode = async () => {
      try {
        const response = await fetch('/settings/dark-mode', {
          headers: {
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (response.ok) {
          const data = await response.json();

          if (data && typeof data.dark_mode !== 'undefined') {
            const isDark = data.dark_mode;
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
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
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

    // Save to database using fetch
    try {
      const response = await fetch('/settings/dark-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          dark_mode: newDarkMode
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
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
