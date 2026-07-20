// services/paiementApi.js
import { getBackendUrl } from '../src/utils/getBackendUrl';

const getApiUrl = () => `${getBackendUrl()}/api`;

class PaiementApi {
    static async getAllPaiements() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${getApiUrl()}/paiements`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Erreur chargement paiements');
        return response.json();
    }
    
    static async updatePaiement(patientId, data) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${getApiUrl()}/paiements/${patientId}/payment`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur mise à jour');
        }
        return response.json();
    }
    
    static async getHistorique(patientId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${getApiUrl()}/paiements/${patientId}/payment-history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Erreur chargement historique');
        return response.json();
    }
    
    static async getAlertes() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${getApiUrl()}/paiements/alertes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Erreur chargement alertes');
        return response.json();
    }
    
    static async marquerAlerteLue(alerteId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${getApiUrl()}/paiements/alertes/${alerteId}/lire`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    }
    
    static async supprimerAlerte(alerteId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${getApiUrl()}/paiements/alertes/${alerteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    }
    
    static async getStats() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${getApiUrl()}/paiements/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Erreur chargement stats');
        return response.json();
    }
}

export default PaiementApi;