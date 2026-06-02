// resources/js/lib/axios.js
import axios from 'axios';

const api = axios.create({
    withCredentials: true,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.content;
};

// Request interceptor - ALWAYS add fresh token
api.interceptors.request.use((config) => {
    const token = getCsrfToken();
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token;
        // Also add X-XSRF-TOKEN for Laravel
        config.headers['X-XSRF-TOKEN'] = token;
    } else {
        console.warn('⚠️ No CSRF token found in meta tag');
    }

    console.log(`📤 ${config.method?.toUpperCase()} ${config.url} - CSRF: ${token ? '✅' : '❌'}`);
    return config;
});

// Response interceptor
api.interceptors.response.use(
    response => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 419 && !originalRequest._retry) {
            originalRequest._retry = true;
            console.warn('🔄 CSRF token expired, refreshing...');

            try {
                // Fetch fresh CSRF cookie
                await axios.get('/sanctum/csrf-cookie', {
                    withCredentials: true,
                });

                // Wait a bit for cookie to be set
                await new Promise(resolve => setTimeout(resolve, 100));

                // Get new token
                const newToken = getCsrfToken();
                if (newToken) {
                    originalRequest.headers['X-CSRF-TOKEN'] = newToken;
                    originalRequest.headers['X-XSRF-TOKEN'] = newToken;
                    console.log('✅ CSRF refreshed, retrying...');
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error('❌ CSRF refresh failed:', refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
