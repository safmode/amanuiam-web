// resources/js/app.jsx
import '../css/app.css';
import './bootstrap.jsx';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import axios from 'axios';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// ===== FIXED AXIOS CONFIGURATION =====
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

// Function to get current CSRF token from meta tag
const getCurrentCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.content;
};

// Set initial token
const initialToken = getCurrentCsrfToken();
if (initialToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = initialToken;
}

// IMPORTANT: Add request interceptor to ALWAYS use the latest token
axios.interceptors.request.use((config) => {
    // Always use the current token from meta tag, not a cached one
    const currentToken = getCurrentCsrfToken();
    if (currentToken) {
        config.headers['X-CSRF-TOKEN'] = currentToken;
    }
    return config;
});

// Handle 419 errors by refreshing token and retrying once
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 419 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Refresh the CSRF cookie
                await axios.get('/sanctum/csrf-cookie');

                // Get the new token from meta tag (it should be updated by Laravel)
                const newToken = getCurrentCsrfToken();
                if (newToken) {
                    axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
                    originalRequest.headers['X-CSRF-TOKEN'] = newToken;
                }

                // Retry the original request
                return axios(originalRequest);
            } catch (refreshError) {
                console.error('Failed to refresh CSRF token', refreshError);
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);
// ===== END OF AXIOS CONFIGURATION =====

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
