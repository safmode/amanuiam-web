import axios from 'axios';

// Set the base URL to the current origin (will be HTTPS in production)
window.axios = axios;
window.axios.defaults.baseURL = window.location.origin;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

if (typeof window !== 'undefined') {
    import('./echo');
}
