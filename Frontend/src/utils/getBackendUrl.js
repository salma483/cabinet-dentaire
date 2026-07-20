// Fonction centralisée pour obtenir l'URL du backend
// S'adapte automatiquement à l'environnement (dev local ou production)

export const getBackendUrl = () => {
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

export default getBackendUrl;
