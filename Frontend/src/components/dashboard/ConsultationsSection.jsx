// src/components/dashboard/ConsultationsSection.jsx
import React, { useState, useEffect } from 'react';
import { FaPlus, FaEye, FaEdit, FaTrash, FaStethoscope, FaSearch, FaSync, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const ConsultationsSection = ({ patients }) => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [patientConsultations, setPatientConsultations] = useState([]);
  const [consultationForm, setConsultationForm] = useState({
    patient_id: '',
    diagnosis: '',
    observation: '',
    prescription: '',
    treatment: '',
    consultation_date: new Date().toISOString().split('T')[0]
  });

  const token = localStorage.getItem('token');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchAllConsultations();
  }, []);

  // Récupérer toutes les consultations
  const fetchAllConsultations = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/consultations', axiosConfig);
      setConsultations(response.data);
    } catch (error) {
      console.error('Erreur chargement consultations:', error);
      if (error.response?.status === 500) {
        toast.error('La table consultations n\'existe pas. Veuillez exécuter le script SQL.');
      } else {
        toast.error('Erreur de chargement des consultations');
      }
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les consultations d'un patient
  const fetchPatientConsultations = async (patientId) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/consultations/patient/${patientId}`, axiosConfig);
      setPatientConsultations(response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir modal pour ajouter consultation
  const handleOpenAddModal = (patient) => {
    setSelectedPatient(patient);
    setConsultationForm({
      patient_id: patient.id,
      diagnosis: '',
      observation: '',
      prescription: '',
      treatment: '',
      consultation_date: new Date().toISOString().split('T')[0]
    });
    setSelectedConsultation(null);
    setShowConsultModal(true);
  };

  // Ouvrir modal pour voir les consultations d'un patient
  const handleViewPatientConsultations = async (patient) => {
    setSelectedPatient(patient);
    await fetchPatientConsultations(patient.id);
    setShowViewModal(true);
  };

  // Ajouter une consultation
  const handleAddConsultation = async () => {
    if (!consultationForm.patient_id) {
      toast.error('Patient non identifié');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/consultations', consultationForm, axiosConfig);
      if (response.data.success) {
        toast.success('Consultation enregistrée avec succès');
        setShowConsultModal(false);
        resetForm();
        fetchAllConsultations();
        if (showViewModal && selectedPatient) {
          await fetchPatientConsultations(selectedPatient.id);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  // Modifier une consultation
  const handleEditConsultation = async () => {
    if (!selectedConsultation) return;

    setLoading(true);
    try {
      const response = await axios.put(`http://localhost:5000/api/consultations/${selectedConsultation.id}`, consultationForm, axiosConfig);
      if (response.data.success) {
        toast.success('Consultation modifiée avec succès');
        setShowConsultModal(false);
        setSelectedConsultation(null);
        resetForm();
        fetchAllConsultations();
        if (showViewModal && selectedPatient) {
          await fetchPatientConsultations(selectedPatient.id);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une consultation
  const handleDeleteConsultation = async (id) => {
    if (window.confirm('Supprimer cette consultation ?')) {
      setLoading(true);
      try {
        await axios.delete(`http://localhost:5000/api/consultations/${id}`, axiosConfig);
        toast.success('Consultation supprimée');
        fetchAllConsultations();
        if (showViewModal && selectedPatient) {
          await fetchPatientConsultations(selectedPatient.id);
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors de la suppression');
      } finally {
        setLoading(false);
      }
    }
  };

  // Ouvrir modal pour modifier une consultation
  const handleOpenEditModal = (consultation) => {
    setSelectedConsultation(consultation);
    setConsultationForm({
      patient_id: consultation.patient_id,
      diagnosis: consultation.diagnosis || '',
      observation: consultation.observation || '',
      prescription: consultation.prescription || '',
      treatment: consultation.treatment || '',
      consultation_date: consultation.consultation_date?.split('T')[0] || new Date().toISOString().split('T')[0]
    });
    setShowConsultModal(true);
  };

  const resetForm = () => {
    setConsultationForm({
      patient_id: '',
      diagnosis: '',
      observation: '',
      prescription: '',
      treatment: '',
      consultation_date: new Date().toISOString().split('T')[0]
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Filtrer les patients
  const filteredPatients = patients.filter(patient =>
    patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  // Compter le nombre de consultations par patient
  const getConsultationCount = (patientId) => {
    return consultations.filter(c => c.patient_id === patientId).length;
  };

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h4 style={{ margin: 0 }}>
          <FaStethoscope style={{ marginRight: '10px', color: '#667eea' }} />
          Gestion des Consultations
        </h4>
        <button 
          onClick={fetchAllConsultations}
          style={{
            background: '#6c757d', 
            color: 'white', 
            border: 'none', 
            padding: '8px 15px', 
            borderRadius: '8px', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          disabled={loading}
        >
          <FaSync className={loading ? 'fa-spin' : ''} /> 
          Actualiser
        </button>
      </div>

      {/* Barre de recherche */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
        <input
          type="text"
          placeholder="Rechercher un patient..."
          style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #dee2e6' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Liste des patients */}
      <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead style={{ background: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left' }}>Patient</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Âge</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Téléphone</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Nb Consultations</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((patient, index) => (
              <tr key={patient.id} style={{ borderBottom: index !== filteredPatients.length - 1 ? '1px solid #eee' : 'none' }}>
                <td style={{ padding: '12px', fontWeight: '500' }}>{patient.full_name}</td>
                <td style={{ padding: '12px' }}>{patient.age || '-'} ans</td>
                <td style={{ padding: '12px' }}>{patient.phone || '-'}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{
                    background: getConsultationCount(patient.id) > 0 ? '#d4edda' : '#f8d7da',
                    color: getConsultationCount(patient.id) > 0 ? '#155724' : '#721c24',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {getConsultationCount(patient.id)} consultation(s)
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button 
                    onClick={() => handleOpenAddModal(patient)} 
                    style={{ background: '#28a745', border: 'none', color: 'white', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', marginRight: '8px' }} 
                    title="Ajouter consultation"
                  >
                    <FaPlus /> Ajouter
                  </button>
                  <button 
                    onClick={() => handleViewPatientConsultations(patient)} 
                    style={{ background: '#667eea', border: 'none', color: 'white', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px' }} 
                    title="Voir consultations"
                  >
                    <FaEye /> Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredPatients.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '15px' }}>
          <p>Aucun patient trouvé</p>
        </div>
      )}

      {/* ============ MODAL AJOUTER/MODIFIER CONSULTATION ============ */}
      {showConsultModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 2000 
        }}>
          <div style={{ background: 'white', borderRadius: '15px', width: '550px', maxWidth: '90%', padding: '25px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0 }}>
                <FaStethoscope style={{ marginRight: '8px', color: '#667eea' }} />
                {selectedConsultation ? 'Modifier la consultation' : `Nouvelle consultation - ${selectedPatient?.full_name || ''}`}
              </h4>
              <button onClick={() => { setShowConsultModal(false); setSelectedConsultation(null); resetForm(); }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
                <FaTimes />
              </button>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date de consultation</label>
              <input
                type="date"
                value={consultationForm.consultation_date}
                onChange={(e) => setConsultationForm({ ...consultationForm, consultation_date: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Diagnostic</label>
              <textarea
                value={consultationForm.diagnosis}
                onChange={(e) => setConsultationForm({ ...consultationForm, diagnosis: e.target.value })}
                rows="3"
                placeholder="Description du diagnostic..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Observations</label>
              <textarea
                value={consultationForm.observation}
                onChange={(e) => setConsultationForm({ ...consultationForm, observation: e.target.value })}
                rows="3"
                placeholder="Observations cliniques..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prescription</label>
              <textarea
                value={consultationForm.prescription}
                onChange={(e) => setConsultationForm({ ...consultationForm, prescription: e.target.value })}
                rows="3"
                placeholder="Médicaments prescrits..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Traitement proposé</label>
              <textarea
                value={consultationForm.treatment}
                onChange={(e) => setConsultationForm({ ...consultationForm, treatment: e.target.value })}
                rows="3"
                placeholder="Plan de traitement..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={selectedConsultation ? handleEditConsultation : handleAddConsultation}
                disabled={loading}
                style={{
                  flex: 1, padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Chargement...' : (selectedConsultation ? 'Modifier' : 'Enregistrer')}
              </button>
              <button
                onClick={() => { setShowConsultModal(false); setSelectedConsultation(null); resetForm(); }}
                style={{ padding: '12px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL VOIR CONSULTATIONS DU PATIENT ============ */}
      {showViewModal && selectedPatient && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 2000 
        }}>
          <div style={{ background: 'white', borderRadius: '15px', width: '800px', maxWidth: '90%', padding: '25px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0 }}>
                <FaStethoscope style={{ marginRight: '8px', color: '#667eea' }} />
                Consultations de {selectedPatient.full_name}
              </h4>
              <div>
                <button 
                  onClick={() => handleOpenAddModal(selectedPatient)} 
                  style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', marginRight: '10px' }}
                >
                  <FaPlus /> Nouvelle consultation
                </button>
                <button onClick={() => setShowViewModal(false)} style={{ background: '#dc3545', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', padding: '5px 12px', borderRadius: '8px' }}>✕</button>
              </div>
            </div>

            {patientConsultations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>Aucune consultation pour ce patient</p>
                <button 
                  onClick={() => handleOpenAddModal(selectedPatient)}
                  style={{ background: '#667eea', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}
                >
                  <FaPlus /> Ajouter la première consultation
                </button>
              </div>
            ) : (
              patientConsultations.map((consultation) => (
                <div key={consultation.id} style={{ 
                  background: '#f8f9fa', 
                  borderRadius: '12px', 
                  padding: '15px', 
                  marginBottom: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <div>
                      <strong style={{ color: '#667eea' }}>📅 {formatDate(consultation.consultation_date)}</strong>
                    </div>
                    <div>
                      <button 
                        onClick={() => {
                          setShowViewModal(false);
                          handleOpenEditModal(consultation);
                        }} 
                        style={{ background: '#ffc107', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', marginRight: '5px' }}
                        title="Modifier"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDeleteConsultation(consultation.id)} 
                        style={{ background: '#dc3545', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}
                        title="Supprimer"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  
                  {consultation.diagnosis && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Diagnostic:</strong>
                      <p style={{ margin: '5px 0 0 15px', color: '#555' }}>{consultation.diagnosis}</p>
                    </div>
                  )}
                  
                  {consultation.observation && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Observations:</strong>
                      <p style={{ margin: '5px 0 0 15px', color: '#555' }}>{consultation.observation}</p>
                    </div>
                  )}
                  
                  {consultation.prescription && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Prescription:</strong>
                      <p style={{ margin: '5px 0 0 15px', color: '#555' }}>{consultation.prescription}</p>
                    </div>
                  )}
                  
                  {consultation.treatment && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Traitement:</strong>
                      <p style={{ margin: '5px 0 0 15px', color: '#555' }}>{consultation.treatment}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationsSection;