// frontend/src/services/api.js (CRÉER CE FICHIER)
import axios from 'axios';

// Configuration automatique selon l'environnement
const getApiUrl = () => {
    // Si on est en production (Render)
    if (process.env.NODE_ENV === 'production') {
        // Cette URL sera configurée sur Render
        return process.env.REACT_APP_API_URL || '/api';
    }
    // En développement local
    return 'http://localhost:5000/api';
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