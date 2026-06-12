// PatientsList.jsx - VERSION AVEC ADRESSE

import React from 'react';
import { FaPlus, FaSearch, FaXRay, FaCalendarAlt, FaTrash } from 'react-icons/fa';

const PatientsList = ({ 
  patients, 
  searchTerm, 
  setSearchTerm, 
  setShowAddModal, 
  handleOpenRadiographies, 
  setNewAppointment, 
  setShowAppointmentModal, 
  handleDeletePatient,
  setSelectedPatientForPaiement,
  setShowPaiementModal
}) => {

  const filteredPatients = patients.filter(patient =>
    patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm) ||
    patient.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fonction pour ouvrir le modal de paiement
  const handleOpenPayment = (patient) => {
    setSelectedPatientForPaiement(patient);
    setShowPaiementModal(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h4 style={{ margin: 0 }}>Liste des Patients</h4>
        <button onClick={() => setShowAddModal(true)} style={{
          background: '#667eea', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer'
        }}>
          <FaPlus style={{ marginRight: '8px' }} /> Nouveau Patient
        </button>
      </div>

      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
        <input
          type="text"
          placeholder="Rechercher un patient (nom, téléphone, adresse)..."
          style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #dee2e6' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {patients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '15px' }}>
          <p>Aucun patient trouvé. Cliquez sur "Nouveau Patient" pour ajouter.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left' }}>N° Fiche</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Date naissance</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Âge</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Téléphone</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Adresse</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Statut Paiement</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient, index) => (
                <tr key={patient.id} style={{ borderBottom: index !== filteredPatients.length - 1 ? '1px solid #eee' : 'none' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#667eea' }}>
                    {patient.numero_fiche || '-'}
                  </td>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{patient.full_name}</td>
                  <td style={{ padding: '12px' }}>{formatDate(patient.birth_date)}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: patient.age < 18 ? '#d4edda' : (patient.age >= 65 ? '#f8d7da' : '#cfe2ff'),
                      color: patient.age < 18 ? '#155724' : (patient.age >= 65 ? '#721c24' : '#004085'),
                      padding: '4px 8px', borderRadius: '12px', fontSize: '12px'
                    }}>
                      {patient.age || '-'} ans
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{patient.phone || '-'}</td>
                  <td style={{ 
                    padding: '12px', 
                    maxWidth: '200px', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    color: '#6c757d',
                    fontSize: '13px'
                  }} 
                  title={patient.address || '-'}>
                    {patient.address || '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span 
                      onClick={() => handleOpenPayment(patient)}
                      style={{
                        background: patient.paiement_status === 'paye' ? '#d4edda' : 
                                  (patient.paiement_status === 'semi_paye' ? '#fff3cd' : '#f8d7da'),
                        color: patient.paiement_status === 'paye' ? '#155724' : 
                              (patient.paiement_status === 'semi_paye' ? '#856404' : '#721c24'),
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'inline-block',
                        cursor: 'pointer'
                      }}
                      title="Cliquer pour gérer le paiement"
                    >
                      {patient.paiement_status === 'paye' ? '✅ Payé' : 
                       (patient.paiement_status === 'semi_paye' ? '⚠️ Semi-payé' : '❌ Non payé')}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button onClick={() => handleOpenRadiographies(patient)} style={{ background: 'none', border: 'none', color: '#6f42c1', cursor: 'pointer', marginRight: '10px' }} title="Radiographies">
                      <FaXRay />
                    </button>
                    <button onClick={() => {
                      setNewAppointment({ 
                        patient_id: patient.id, 
                        patient_name: patient.full_name, 
                        appointment_date: new Date().toISOString().split('T')[0], 
                        appointment_time: '09:00', 
                        type: 'Consultation', 
                        notes: '' 
                      });
                      setShowAppointmentModal(true);
                    }} style={{ background: 'none', border: 'none', color: '#28a745', cursor: 'pointer', marginRight: '10px' }} title="Prendre RDV">
                      <FaCalendarAlt />
                    </button>
                    <button onClick={() => handleDeletePatient(patient.id)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }} title="Supprimer">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {filteredPatients.length === 0 && patients.length > 0 && (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '15px' }}>
          <p>Aucun patient ne correspond à votre recherche</p>
        </div>
      )}
    </div>
  );
};

export default PatientsList;