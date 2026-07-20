// C:\Users\salma\dentist-dashboard\frontend\src\config.js
// OU
// C:\Users\salma\dentist-dashboard\Frontend\src\config.js

const BACKEND_URL = 'http://localhost:5000';

const API_CONFIG = {
    // URL du backend principal
    BACKEND_URL,

    // URL du Dashboard Principal (backend)
    DASHBOARD_API: `${BACKEND_URL}/api`,
    
    // URL du service de radiologie intégré au backend principal
    RADIOLOGY_API: `${BACKEND_URL}/api/patients`,

    // URL racine pour les fichiers uploadés
    UPLOADS_URL: `${BACKEND_URL}/uploads`
};

export default API_CONFIG;