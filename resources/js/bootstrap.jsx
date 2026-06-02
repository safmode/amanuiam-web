import axios from 'axios';
import '../css/app.css';

/**
 * Inertia.js setup
 */
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

/**
 * Axios Configuration - Minimal and Clean
 */
window.axios = axios;

// Essential defaults
window.axios.defaults.withCredentials = true;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.headers.common['Accept'] = 'application/json';

// Get CSRF token from meta tag (Laravel automatically adds this)
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (csrfToken) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
    console.log('✅ CSRF token loaded');
} else {
    console.warn('⚠️ CSRF token not found - make sure your main layout has the meta tag');
}

/**
 * Echo Configuration (if you're using WebSockets)
 * Remove this import if you're not using Echo
 */
// import Echo from 'laravel-echo';
// import Pusher from 'pusher-js';
// window.Pusher = Pusher;
// window.Echo = new Echo({...});

/**
 * Inertia App Initialization
 */
const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

/**
 * Global error handler for debugging
 */
window.addEventListener('error', (event) => {
    if (event.message?.includes('CSRF') || event.message?.includes('419')) {
        console.error('CSRF Error detected - possible causes:');
        console.error('1. Session expired - refresh the page');
        console.error('2. Multiple tabs open - close other tabs');
        console.error('3. Server configuration issue - check .env APP_URL');
    }
});

console.log('🚀 Bootstrap loaded successfully');
