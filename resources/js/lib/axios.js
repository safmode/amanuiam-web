// resources/js/lib/axios.js
import axios from 'axios';

// Create a custom axios instance
const api = axios.create({
    withCredentials: true,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

// Helper to get current CSRF token
const getCurrentCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.content;
};

// REQUEST INTERCEPTOR - Always use fresh CSRF token
api.interceptors.request.use((config) => {
    const token = getCurrentCsrfToken();
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token;
    }

    // Log for debugging (remove in production)
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} - CSRF: ${token ? '✅' : '❌'}`);

    return config;
}, (error) => {
    return Promise.reject(error);
});

// RESPONSE INTERCEPTOR - Handle 419 errors without requiring refresh
api.interceptors.response.use(
    response => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 419 CSRF token mismatch
        if (error.response?.status === 419 && !originalRequest._retry) {
            originalRequest._retry = true;

            console.warn('CSRF token expired, refreshing...');

            try {
                // Fetch fresh CSRF cookie from server
                await axios.get('/sanctum/csrf-cookie', {
                    withCredentials: true,
                });

                // Small delay to ensure cookie is set
                await new Promise(resolve => setTimeout(resolve, 100));

                // Get the new token
                const newToken = getCurrentCsrfToken();
                if (newToken) {
                    originalRequest.headers['X-CSRF-TOKEN'] = newToken;
                }

                console.log('CSRF refreshed, retrying request...');

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                console.error('CSRF refresh failed:', refreshError);

                // Last resort: reload the page
                if (confirm('Session expired. Would you like to refresh the page?')) {
                    window.location.reload();
                }
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
