// frontend/src/services/appointmentApi.js
import api from './api';

class AppointmentApi {
  static async getAll() {
    const response = await api.get('/appointments');
    return response.data;
  }

  static async getToday() {
    const response = await api.get('/appointments/today');
    return response.data;
  }

  static async create(data) {
    const response = await api.post('/appointments', data);
    return response.data;
  }

  static async update(id, data) {
    const response = await api.put(`/appointments/${id}`, data);
    return response.data;
  }

  static async delete(id) {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  }
}

export default AppointmentApi;