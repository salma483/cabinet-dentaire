// src/components/dashboard/AppointmentsList.jsx
import React from 'react';
import { FaPlus, FaSearch, FaTrash } from 'react-icons/fa';

const AppointmentsList = ({ 
  appointments, 
  searchTerm, 
  setSearchTerm, 
  dateFilter, 
  setDateFilter, 
  setShowAppointmentModal, 
  handleDeleteAppointment 
}) => {
  const filteredAppointments = appointments.filter(apt =>
    apt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (apt.appointment_date === dateFilter)
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h4 style={{ margin: 0 }}>Gestion des Rendez-vous</h4>
        <button onClick={() => setShowAppointmentModal(true)} style={{
          background: '#667eea', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer'
        }}>
          <FaPlus style={{ marginRight: '8px' }} /> Nouveau Rendez-vous
        </button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
          <input
            type="text"
            placeholder="Rechercher par nom..."
            style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #dee2e6' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <input
          type="date"
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #dee2e6' }}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead style={{ background: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left' }}>Patient</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Heure</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Statut</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.map((apt, index) => (
              <tr key={apt.id} style={{ borderBottom: index !== filteredAppointments.length - 1 ? '1px solid #eee' : 'none' }}>
                <td style={{ padding: '12px', fontWeight: '500' }}>{apt.patient_name}</td>
                <td style={{ padding: '12px' }}>{new Date(apt.appointment_date).toLocaleDateString()}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ background: '#e9ecef', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                    {apt.appointment_time?.substring(0, 5)}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    background: apt.type === 'Consultation' ? '#cfe2ff' : (apt.type === 'Urgence' ? '#f8d7da' : '#d4edda'),
                    color: apt.type === 'Consultation' ? '#004085' : (apt.type === 'Urgence' ? '#721c24' : '#155724'),
                    padding: '4px 8px', borderRadius: '12px', fontSize: '12px'
                  }}>
                    {apt.type}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    background: apt.status === 'scheduled' ? '#cfe2ff' : (apt.status === 'completed' ? '#d4edda' : '#f8d7da'),
                    color: apt.status === 'scheduled' ? '#004085' : (apt.status === 'completed' ? '#155724' : '#721c24'),
                    padding: '4px 8px', borderRadius: '12px', fontSize: '12px'
                  }}>
                    {apt.status === 'scheduled' ? 'Planifié' : (apt.status === 'completed' ? 'Effectué' : 'Annulé')}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <button onClick={() => handleDeleteAppointment(apt.id)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}>
                    <FaTrash title="Supprimer" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredAppointments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '15px' }}>
          <p>Aucun rendez-vous trouvé</p>
        </div>
      )}
    </div>
  );
};

export default AppointmentsList;