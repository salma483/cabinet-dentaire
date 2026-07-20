// Configuration dynamique selon l'environnement
const getBackendUrl = () => {
  // En développement local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  }

  // En production, utiliser la même origine (le backend doit être sur le même domaine)
  // Ou utiliser une variable d'environnement si disponible
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }

  // Par défaut en production, utiliser /api (proxy)
  return `${window.location.protocol}//${window.location.hostname}:${window.location.port || (window.location.protocol === 'https:' ? 443 : 80)}/api`;
};

const BACKEND_URL = getBackendUrl();

const API_CONFIG = {
  BACKEND_URL,
  DASHBOARD_API: `${BACKEND_URL}/api`,
  RADIOLOGY_API: `${BACKEND_URL}/api/patients`,
  UPLOADS_URL: `${BACKEND_URL}/uploads`
};

export default API_CONFIG;