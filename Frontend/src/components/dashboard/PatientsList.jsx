// frontend/src/components/dashboard/PatientsList.jsx
import React, { useState } from 'react';
import { 
  FaPlus, FaSearch, FaXRay, FaCalendarAlt, FaTrash, FaFileExcel, FaEdit,
  FaCheckSquare, FaSquare, FaTrashAlt
} from 'react-icons/fa';
import ImportExcelModal from './Modals/ImportExcelModal';
import EditPatientModal from './Modals/EditPatientModal';

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
  setShowPaiementModal,
  refreshPatients,
  onEditPatient,
  onDeleteMultiplePatients
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleImportSuccess = () => {
    if (refreshPatients) {
      refreshPatients();
    }
  };

  const handleOpenEditModal = (patient) => {
    setSelectedPatient(patient);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedPatient(null);
  };

  // Sélectionner/désélectionner un patient
  const toggleSelectPatient = (patientId) => {
    setSelectedPatients(prev => {
      if (prev.includes(patientId)) {
        return prev.filter(id => id !== patientId);
      } else {
        return [...prev, patientId];
      }
    });
  };

  // Sélectionner tous les patients
  const selectAllPatients = () => {
    const filteredIds = filteredPatients.map(p => p.id);
    if (selectedPatients.length === filteredIds.length && filteredIds.length > 0) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(filteredIds);
    }
  };

  // Ouvrir le modal de confirmation de suppression
  const openDeleteModal = () => {
    if (selectedPatients.length === 0) return;
    setShowDeleteModal(true);
  };

  // Supprimer les patients sélectionnés
  const handleDeleteMultiple = async () => {
    if (selectedPatients.length === 0) return;
    
    setIsDeleting(true);
    try {
      if (onDeleteMultiplePatients) {
        await onDeleteMultiplePatients(selectedPatients);
      }
      setSelectedPatients([]);
      setShowDeleteModal(false);
      if (refreshPatients) {
        refreshPatients();
      }
    } catch (error) {
      console.error('Erreur suppression multiple:', error);
    } finally {
      setIsDeleting(false);
    }
  };

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

  const handleOpenPayment = (patient) => {
    setSelectedPatientForPaiement(patient);
    setShowPaiementModal(true);
  };

  return (
    <div>
      {/* Barre d'outils */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px', 
        flexWrap: 'wrap', 
        gap: '10px' 
      }}>
        <h4 style={{ margin: 0 }}>
          Liste des Patients
          {selectedPatients.length > 0 && (
            <span style={{ 
              marginLeft: '15px', 
              fontSize: '14px', 
              color: '#667eea',
              fontWeight: 'normal'
            }}>
              ({selectedPatients.length} sélectionné{selectedPatients.length > 1 ? 's' : ''})
            </span>
          )}
        </h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {patients.length > 0 && (
            <>
              <button
                onClick={selectAllPatients}
                style={{
                  padding: '8px 15px',
                  background: selectedPatients.length === filteredPatients.length && filteredPatients.length > 0 ? '#6c757d' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px'
                }}
                title={selectedPatients.length === filteredPatients.length && filteredPatients.length > 0 ? 'Désélectionner tout' : 'Sélectionner tout'}
              >
                {selectedPatients.length === filteredPatients.length && filteredPatients.length > 0 ? <FaCheckSquare /> : <FaSquare />}
                {selectedPatients.length === filteredPatients.length && filteredPatients.length > 0 ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
              
              {selectedPatients.length > 0 && (
                <button
                  onClick={openDeleteModal}
                  style={{
                    padding: '8px 15px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}
                >
                  <FaTrashAlt /> Supprimer ({selectedPatients.length})
                </button>
              )}
            </>
          )}
          
          <button 
            onClick={() => setShowImportModal(true)} 
            style={{
              background: '#28a745', 
              color: 'white', 
              border: 'none', 
              padding: '8px 15px', 
              borderRadius: '8px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            <FaFileExcel /> Importer
          </button>
          <button onClick={() => setShowAddModal(true)} style={{
            background: '#667eea', 
            color: 'white', 
            border: 'none', 
            padding: '8px 15px', 
            borderRadius: '8px', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px'
          }}>
            <FaPlus /> Nouveau
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
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

      {/* Tableau des patients */}
      {patients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '15px' }}>
          <p>Aucun patient trouvé. Cliquez sur "Nouveau Patient" pour ajouter.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'center', width: '40px' }}>
                  <button
                    onClick={selectAllPatients}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: selectedPatients.length === filteredPatients.length && filteredPatients.length > 0 ? '#667eea' : '#6c757d'
                    }}
                    title="Sélectionner tout"
                  >
                    {selectedPatients.length === filteredPatients.length && filteredPatients.length > 0 ? <FaCheckSquare /> : <FaSquare />}
                  </button>
                </th>
                <th style={{ padding: '12px', textAlign: 'left' }}>N° Fiche</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Date naissance</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Âge</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Téléphone</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Adresse</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Statut Paiement</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient, index) => (
                <tr 
                  key={patient.id} 
                  style={{ 
                    borderBottom: index !== filteredPatients.length - 1 ? '1px solid #eee' : 'none',
                    background: selectedPatients.includes(patient.id) ? '#e8f0fe' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                >
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedPatients.includes(patient.id)}
                      onChange={() => toggleSelectPatient(patient.id)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: '#667eea'
                      }}
                    />
                  </td>
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
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleOpenEditModal(patient)} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#ffc107', 
                        cursor: 'pointer', 
                        marginRight: '8px',
                        fontSize: '16px'
                      }} 
                      title="Modifier les coordonnées"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={() => handleOpenRadiographies(patient)} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#6f42c1', 
                        cursor: 'pointer', 
                        marginRight: '8px',
                        fontSize: '16px'
                      }} 
                      title="Radiographies"
                    >
                      <FaXRay />
                    </button>
                    <button 
                      onClick={() => {
                        setNewAppointment({ 
                          patient_id: patient.id, 
                          patient_name: patient.full_name, 
                          appointment_date: new Date().toISOString().split('T')[0], 
                          appointment_time: '09:00', 
                          type: 'Consultation', 
                          notes: '' 
                        });
                        setShowAppointmentModal(true);
                      }} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#28a745', 
                        cursor: 'pointer', 
                        marginRight: '8px',
                        fontSize: '16px'
                      }} 
                      title="Prendre RDV"
                    >
                      <FaCalendarAlt />
                    </button>
                    <button 
                      onClick={() => handleDeletePatient(patient.id)} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#dc3545', 
                        cursor: 'pointer',
                        fontSize: '16px'
                      }} 
                      title="Supprimer"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ 
            padding: '15px 20px', 
            background: '#f8f9fa', 
            borderTop: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '14px',
            color: '#6c757d'
          }}>
            <span>
              {filteredPatients.length} patient{filteredPatients.length > 1 ? 's' : ''} affiché{filteredPatients.length > 1 ? 's' : ''}
              {patients.length !== filteredPatients.length && ` (sur ${patients.length} total)`}
            </span>
            {selectedPatients.length > 0 && (
              <span style={{ color: '#667eea', fontWeight: 'bold' }}>
                {selectedPatients.length} patient{selectedPatients.length > 1 ? 's' : ''} sélectionné{selectedPatients.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}
      
      {filteredPatients.length === 0 && patients.length > 0 && (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '15px' }}>
          <p>Aucun patient ne correspond à votre recherche</p>
        </div>
      )}

      {/* Modals */}
      <ImportExcelModal 
        show={showImportModal}
        setShow={setShowImportModal}
        onImportSuccess={handleImportSuccess}
      />

      <EditPatientModal
        show={showEditModal}
        setShow={handleCloseEditModal}
        patient={selectedPatient}
        onPatientUpdated={() => {
          if (refreshPatients) refreshPatients();
          if (onEditPatient) onEditPatient();
        }}
      />

      {/* Modal de confirmation suppression multiple */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 4000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setShowDeleteModal(false);
            }
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              width: '500px',
              maxWidth: '90%',
              padding: '30px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'fadeIn 0.3s ease'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: '#f8d7da',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 15px'
                }}
              >
                <FaTrashAlt size={35} color="#dc3545" />
              </div>
              <h4 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>
                Confirmer la suppression
              </h4>
              <p style={{ margin: '0', color: '#6c757d', fontSize: '15px' }}>
                Vous êtes sur le point de supprimer <strong>{selectedPatients.length}</strong> patient{selectedPatients.length > 1 ? 's' : ''}.
                <br />
                <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                  Cette action est irréversible !
                </span>
              </p>
            </div>

            <div
              style={{
                maxHeight: '150px',
                overflowY: 'auto',
                background: '#f8f9fa',
                borderRadius: '10px',
                padding: '10px 15px',
                marginBottom: '20px',
                fontSize: '14px'
              }}
            >
              {selectedPatients.map((id, index) => {
                const patient = patients.find(p => p.id === id);
                return patient ? (
                  <div key={id} style={{ 
                    padding: '4px 0',
                    borderBottom: index !== selectedPatients.length - 1 ? '1px solid #dee2e6' : 'none'
                  }}>
                    {patient.full_name} (N°{patient.numero_fiche || '-'})
                  </div>
                ) : null;
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDeleteMultiple}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: isDeleting ? '#6c757d' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                <FaTrash />
                {isDeleting ? 'Suppression en cours...' : `Supprimer ${selectedPatients.length} patient${selectedPatients.length > 1 ? 's' : ''}`}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                style={{
                  padding: '12px 25px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontSize: '16px'
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default PatientsList;