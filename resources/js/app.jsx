import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import axios from 'axios';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// ===== AXIOS CONFIGURATION =====
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

// Get CSRF token from meta tag
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
    console.log('✅ Axios configured with CSRF protection');
}

// Function to refresh CSRF token without reloading the page
const refreshCsrfToken = async () => {
    try {
        await axios.get('/sanctum/csrf-cookie');
        const newToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (newToken) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
            console.log('✅ CSRF token refreshed');
            return true;
        }
    } catch (error) {
        console.error('Failed to refresh CSRF token:', error);
    }
    return false;
};

// Response interceptor - DON'T auto-reload on 419
axios.interceptors.response.use(
    response => response,
    async (error) => {
        const originalRequest = error.config;

        // If it's a 419 error and we haven't retried yet
        if (error.response?.status === 419 && !originalRequest._retry) {
            originalRequest._retry = true;

            console.warn('CSRF token expired, attempting to refresh...');

            // Try to refresh the token
            const refreshed = await refreshCsrfToken();

            if (refreshed) {
                // Update the original request with new token
                originalRequest.headers['X-CSRF-TOKEN'] = axios.defaults.headers.common['X-CSRF-TOKEN'];
                // Retry the request
                return axios(originalRequest);
            } else {
                // If refresh failed, redirect to login page
                console.warn('CSRF refresh failed, redirecting to login');
                window.location.href = '/login';
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);
// ===== END OF AXIOS CONFIGURATION =====

// Function to keep app alive
function AppWithKeepAlive({ children }) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const pingInterval = setInterval(async () => {
            try {
                const response = await fetch('/health');
                if (response.ok) {
                    console.log('🏓 Self-ping successful');
                }
            } catch (error) {
                console.debug('Self-ping failed');
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
