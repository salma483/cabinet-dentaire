// frontend/src/services/axiosConfig.js
import axios from 'axios';

// Détection dynamique du backend selon l'environnement
const getBackendUrl = () => {
  // En développement local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  }

  // En production, utiliser la variable d'environnement si disponible
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }

  // Fallback: utiliser le même domaine que le frontend
  return `${window.location.protocol}//${window.location.hostname}`;
};

const createAxiosInstance = (navigate) => {
  const backendUrl = getBackendUrl();
  const instance = axios.create({
    baseURL: `${backendUrl}/api`
  });

  // Add token to every request
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.clear();
        if (navigate) {
          navigate('/login');
        } else {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export default createAxiosInstance;