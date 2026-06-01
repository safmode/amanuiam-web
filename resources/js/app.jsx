import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import axios from 'axios'; // ADD THIS IMPORT

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// ===== ADD THIS AXIOS CONFIGURATION SECTION =====
// This configures axios once for your entire application
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

// Get CSRF token from meta tag (Laravel sets this automatically on every page load)
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
    console.log('✅ Axios configured with CSRF protection');
}

// Optional: Add response interceptor to handle 419 errors gracefully
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 419) {
            console.warn('CSRF token expired, refreshing...');
            // Refresh the page to get new token (better than showing error)
            window.location.reload();
        }
        return Promise.reject(error);
    }
);
// ===== END OF AXIOS CONFIGURATION =====

// Function to keep app alive (your existing code)
function AppWithKeepAlive({ children }) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const pingInterval = setInterval(async () => {
            try {
                const response = await fetch('/health');
                if (response.ok) {
                    console.log('🏓 Self-ping successful at', new Date().toLocaleTimeString());
                }
            } catch (error) {
                console.debug('Self-ping failed (app might be offline)');
            }
        }, 10 * 60 * 1000);

        return () => clearInterval(pingInterval);
    }, []);

    return children;
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <AppWithKeepAlive>
                <App {...props} />
            </AppWithKeepAlive>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
