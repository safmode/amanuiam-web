import axios from 'axios';

// Set base URL to current origin
window.axios = axios;
window.axios.defaults.baseURL = window.location.origin;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Interceptor to force HTTPS for ALL requests
window.axios.interceptors.request.use(config => {
    if (config.url && typeof config.url === 'string') {
        // If it's an absolute HTTP URL, convert to HTTPS
        if (config.url.startsWith('http://')) {
            config.url = config.url.replace('http://', 'https://');
        }
        // If it's a relative URL, ensure it uses the current origin (which is HTTPS)
        if (config.url.startsWith('/')) {
            config.baseURL = window.location.origin;
        }
    }
    return config;
}, error => {
    return Promise.reject(error);
});

if (typeof window !== 'undefined') {
    import('./echo');
}
