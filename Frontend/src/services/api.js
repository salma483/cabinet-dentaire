// frontend/src/services/api.js
import axios from 'axios';
import { getBackendUrl } from '../utils/getBackendUrl';

const getApiUrl = () => {
    return `${getBackendUrl()}/api`;
};

const api = axios.create({
    baseURL: getApiUrl(),
    headers: {
        'Content-Type': 'application/json',
    }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;