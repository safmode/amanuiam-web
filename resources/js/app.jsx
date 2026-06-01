import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import axios from 'axios';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// ===== SIMPLE AXIOS CONFIGURATION =====
// Only set basic defaults - NO interceptor that interferes with Inertia
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

// Get CSRF token from meta tag if available
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}
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
