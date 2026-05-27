import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';  // ADD THIS

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// ADD THIS FUNCTION - Wrapper component to add self-ping
function AppWithKeepAlive({ children }) {
    useEffect(() => {
        // Only run in browser (not during SSR)
        if (typeof window === 'undefined') return;

        // Ping every 10 minutes to keep app awake on Render free tier
        const pingInterval = setInterval(async () => {
            try {
                const response = await fetch('/health');
                if (response.ok) {
                    console.log('🏓 Self-ping successful at', new Date().toLocaleTimeString());
                }
            } catch (error) {
                // Silent fail - don't clutter console with errors
                console.debug('Self-ping failed (app might be offline)');
            }
        }, 10 * 60 * 1000); // 10 minutes

        // Cleanup interval when component unmounts
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

        // WRAP the App component with our keep-alive functionality
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
