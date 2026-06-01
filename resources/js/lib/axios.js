import axios from 'axios';

// Create a custom axios instance
const api = axios.create({
    withCredentials: true,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    }
});

// Request interceptor - reads CSRF token right before EVERY request
api.interceptors.request.use((config) => {
    // Get the latest CSRF token from meta tag
    const token = document.querySelector('meta[name="csrf-token"]')?.content;
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token;
    } else {
        console.warn('CSRF token not found in meta tag');
    }
    return config;
});

// Response interceptor - handle 419 errors gracefully
api.interceptors.response.use(
    response => response,
    async (error) => {
        const originalRequest = error.config;

        // If 419 error and haven't retried yet
        if (error.response?.status === 419 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Try to refresh CSRF token
            try {
                await axios.get('/sanctum/csrf-cookie', {
                    withCredentials: true,
                });

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                console.error('CSRF refresh failed:', refreshError);
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
