// AppointmentModal.jsx - Version corrigée avec React.memo
import React, { memo } from 'react';

const AppointmentModal = memo(({ 
  showAppointmentModal, 
  setShowAppointmentModal, 
  newAppointment, 
  setNewAppointment, 
  patients, 
  handleAddAppointment 
}) => {
  if (!showAppointmentModal) return null;

  // ⭐ CORRECTION : Handlers locaux stabilisés
  const handlePatientNameChange = (e) => {
    setNewAppointment(prev => ({ ...prev, patient_name: e.target.value }));
  };

  const handleDateChange = (e) => {
    setNewAppointment(prev => ({ ...prev, appointment_date: e.target.value }));
  };

  const handleTimeChange = (e) => {
    setNewAppointment(prev => ({ ...prev, appointment_time: e.target.value }));
  };

  const handleTypeChange = (e) => {
    setNewAppointment(prev => ({ ...prev, type: e.target.value }));
  };

  const handleNotesChange = (e) => {
    setNewAppointment(prev => ({ ...prev, notes: e.target.value }));
  };

  const handleClose = () => setShowAppointmentModal(false);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: 'white', borderRadius: '15px', width: '500px', maxWidth: '90%', padding: '25px' }}>
        <h4 style={{ marginBottom: '20px' }}>Nouveau Rendez-vous</h4>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Nom du patient *</label>
          <input 
            list="patientNames"
            type="text" 
            placeholder="Sélectionner ou écrire le nom" 
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            value={newAppointment.patient_name || ''} 
            onChange={handlePatientNameChange}
            autoFocus
          />
          <datalist id="patientNames">
            {patients.map(p => <option key={p.id} value={p.full_name} />)}
          </datalist>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Date *</label>
            <input 
              type="date" 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              value={newAppointment.appointment_date || ''} 
              onChange={handleDateChange}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Heure *</label>
            <input 
              type="time" 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              value={newAppointment.appointment_time || ''} 
              onChange={handleTimeChange}
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Type de visite</label>
          <select 
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            value={newAppointment.type || 'Consultation'} 
            onChange={handleTypeChange}
          >
            <option value="Consultation">Consultation</option>
            <option value="Urgence">Urgence</option>
            <option value="Contrôle">Contrôle</option>
            <option value="Détartrage">Détartrage</option>
            <option value="Implantologie">Implantologie</option>
            <option value="Orthodontie">Orthodontie</option>
          </select>
        </div>
        
        <textarea 
          placeholder="Notes (optionnel)" 
          rows="2" 
          style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd' }}
          value={newAppointment.notes || ''} 
          onChange={handleNotesChange}
        />
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={handleClose} style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Annuler
          </button>
          <button onClick={handleAddAppointment} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
});

AppointmentModal.displayName = 'AppointmentModal';

export default AppointmentModal;