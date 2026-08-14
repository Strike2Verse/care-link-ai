import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: 'http://localhost:5005/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper to get user from either storage (Remember Me support)
export const getStoredUser = () => {
    const sessionUser = sessionStorage.getItem('careLinkUser');
    const localUser = localStorage.getItem('careLinkUser');
    const raw = sessionUser || localUser;
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
};

// Helper to clear user from both storages (for logout)
export const clearStoredUser = () => {
    localStorage.removeItem('careLinkUser');
    sessionStorage.removeItem('careLinkUser');
};

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const user = getStoredUser();
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
