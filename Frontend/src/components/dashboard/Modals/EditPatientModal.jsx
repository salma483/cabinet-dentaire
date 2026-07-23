// frontend/src/components/dashboard/Modals/EditPatientModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaUserEdit } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_CONFIG from '../../../config';

const EditPatientModal = ({ show, setShow, patient, onPatientUpdated }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    birth_date: '',
    phone: '',
    address: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patient && show) {
      setFormData({
        full_name: patient.full_name || '',
        birth_date: patient.birth_date ? patient.birth_date.split('T')[0] : '',
        phone: patient.phone || '',
        address: patient.address || '',
      });
      setError('');
    }
  }, [patient, show]);

  if (!show || !patient) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.full_name || formData.full_name.trim() === '') {
      setError('Le nom complet est requis');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_CONFIG.DASHBOARD_API}/patients/${patient.id}`,
        {
          full_name: formData.full_name.trim(),
          birth_date: formData.birth_date || null,
          phone: formData.phone || null,
          address: formData.address || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Coordonnées du patient mises à jour avec succès !');
        if (onPatientUpdated) onPatientUpdated();
        setShow(false);
      } else {
        setError(response.data.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur modification patient:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erreur lors de la mise à jour du patient';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShow(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '20px',
          width: '500px',
          maxWidth: '90%',
          padding: '30px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaUserEdit color="#ffc107" />
            Modifier les coordonnées
          </h4>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '5px',
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Informations du patient */}
        <div
          style={{
            background: '#f8f9fa',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>N° Fiche:</strong> {patient.numero_fiche || '-'}
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6c757d' }}>
            ID: {patient.id}
          </p>
        </div>

        {/* Formulaire */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Nom complet *
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Nom complet du patient"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #dee2e6',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Date de naissance
          </label>
          <input
            type="date"
            name="birth_date"
            value={formData.birth_date}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #dee2e6',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Téléphone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Numéro de téléphone"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #dee2e6',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Adresse
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Adresse du patient"
            rows="3"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #dee2e6',
              fontSize: '14px',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Message d'erreur */}
        {error && (
          <div
            style={{
              background: '#f8d7da',
              color: '#721c24',
              padding: '10px 15px',
              borderRadius: '8px',
              marginBottom: '15px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '18px' }}>⚠️</span>
            {error}
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px',
              background: isLoading ? '#6c757d' : '#ffc107',
              color: isLoading ? 'white' : '#212529',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            <FaSave />
            {isLoading ? 'Mise à jour...' : 'Enregistrer les modifications'}
          </button>
          <button
            onClick={handleClose}
            style={{
              padding: '12px 25px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPatientModal;