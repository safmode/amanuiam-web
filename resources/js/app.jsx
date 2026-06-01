import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
// Don't configure global axios here - use the custom instance in components

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

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
