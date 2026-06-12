// frontend/src/services/patientApi.js
import api from './api';

class PatientApi {
  static async getAll() {
    const response = await api.get('/patients');
    return response.data;
  }

  static async getStats() {
    const response = await api.get('/patients/stats');
    return response.data;
  }

  static async create(data) {
    const response = await api.post('/patients', data);
    return response.data;
  }

  static async updatePayment(id, data) {
    const response = await api.put(`/patients/${id}/payment`, data);
    return response.data;
  }

  static async delete(id) {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  }
}

export default PatientApi;