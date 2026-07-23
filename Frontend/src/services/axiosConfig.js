// frontend/src/services/axiosConfig.js
import axios from 'axios';

const getBackendUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  }
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  return `${window.location.protocol}//${window.location.hostname}`;
};

const createAxiosInstance = (navigate) => {
  const backendUrl = getBackendUrl();
  const instance = axios.create({
    baseURL: `${backendUrl}/api`,
    timeout: 120000, // ⏰ 2 minutes de timeout (important pour l'import)
    retry: 3, // 🔄 3 tentatives en cas d'échec
    retryDelay: 1000, // ⏱️ Attendre 1s entre les tentatives
  });

  // Intercepteur pour les requêtes
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Intercepteur pour les réponses avec retry
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      
      // Si c'est une erreur réseau (DNS, connexion, etc.)
      if (error.code === 'ERR_NETWORK' || 
          error.code === 'ERR_NAME_NOT_RESOLVED' || 
          error.code === 'ERR_INTERNET_DISCONNECTED' ||
          error.code === 'ERR_NETWORK_CHANGED') {
        
        if (!config._retryCount) {
          config._retryCount = 0;
        }
        
        if (config._retryCount < 3) {
          config._retryCount++;
          console.log(`🔄 Tentative ${config._retryCount}/3 de reconnexion...`);
          
          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Réessayer la requête
          return instance(config);
        }
      }
      
      // Gestion 401/403
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