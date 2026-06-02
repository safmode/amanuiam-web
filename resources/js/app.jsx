import '../css/app.css';
import './bootstrap.jsx';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import axios from 'axios';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// ===== SIMPLE AXIOS CONFIGURATION =====
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

// Request interceptor - always use latest token from meta tag
axios.interceptors.request.use((config) => {
    const currentToken = getCurrentCsrfToken();
    if (currentToken) {
        config.headers['X-CSRF-TOKEN'] = currentToken;
    }
    return config;
});

// Response interceptor - NO PAGE RELOAD!
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        // Just log the error, don't reload
        if (error.response?.status === 419) {
            console.warn('CSRF token error (419) - this is a backend issue');
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
