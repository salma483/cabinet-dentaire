import React from 'react';
import { FaTimes, FaUserPlus } from 'react-icons/fa';

const AddPatientModal = ({ 
  showAddModal, 
  setShowAddModal, 
  newPatient, 
  setNewPatient, 
  handleAddPatient 
}) => {
  if (!showAddModal) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0,0,0,0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 2000 
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '15px', 
        width: '500px', 
        maxWidth: '90%', 
        padding: '25px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ margin: 0 }}>Ajouter un nouveau patient</h4>
          <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
            <FaTimes />
          </button>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Nom complet *
          </label>
          <input
            type="text"
            value={newPatient.full_name}
            onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ced4da',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Date de naissance
          </label>
          <input
            type="date"
            value={newPatient.birth_date}
            onChange={(e) => setNewPatient({ ...newPatient, birth_date: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ced4da',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Téléphone
          </label>
          <input
            type="tel"
            value={newPatient.phone}
            onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ced4da',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Adresse
          </label>
          <textarea
            value={newPatient.address}
            onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
            rows="2"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ced4da',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={handleAddPatient}
            style={{
              flex: 1,
              padding: '12px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <FaUserPlus /> Ajouter
          </button>
          <button
            onClick={() => setShowAddModal(false)}
            style={{
              padding: '12px 20px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPatientModal;