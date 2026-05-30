// FORCE HTTPS - Fix for Render deployment
const forceHTTPS = (url) => {
    if (typeof url === 'string' && url.startsWith('http://')) {
        return url.replace('http://', 'https://');
    }
    return url;
};

// Intercept all fetch requests to force HTTPS
const originalFetch = window.fetch;
window.fetch = function(...args) {
    let url = args[0];
    if (typeof url === 'string') {
        args[0] = forceHTTPS(url);
    }
    return originalFetch.apply(this, args);
};

// Also fix any links or router calls
if (typeof window !== 'undefined') {
    import('./echo');
}

console.log('🔒 HTTPS interceptor active - all HTTP requests will be upgraded to HTTPS');
