// frontend/src/services/axiosConfig.js
import axios from 'axios';

const createAxiosInstance = (navigate) => {
  const instance = axios.create({
    baseURL: 'http://localhost:5000/api'
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