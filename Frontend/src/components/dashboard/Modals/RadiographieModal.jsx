// src/components/dashboard/Modals/RadiographieModal.jsx
import React, { useRef } from 'react';
import { FaXRay, FaUpload, FaTrash } from 'react-icons/fa';

const RadiographieModal = ({ 
  showRadiographieModal, 
  setShowRadiographieModal, 
  selectedRadioPatient, 
  radiographies, 
  newRadiographie, 
  setNewRadiographie, 
  uploading, 
  handleFileChange, 
  handleUploadRadiographie, 
  handleDeleteRadiographie 
}) => {
  const fileInputRef = useRef(null);

  if (!showRadiographieModal || !selectedRadioPatient) return null;
  
  const handleLocalUpload = async () => {
    console.log('Patient ID:', selectedRadioPatient.id);
    console.log('Patient Name:', selectedRadioPatient.full_name);
    console.log('File:', newRadiographie.image);
    
    if (!newRadiographie.image) {
      alert('Veuillez sélectionner une image');
      return;
    }
    
    await handleUploadRadiographie();
    
    // Réinitialiser l'input file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, overflowY: 'auto' }}>
      <div style={{ background: 'white', borderRadius: '15px', width: '800px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '25px' }}>
        <h4 style={{ marginBottom: '20px' }}>
          <FaXRay style={{ marginRight: '10px' }} />
          Radiographies - {selectedRadioPatient.full_name}
          <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
            (ID: {selectedRadioPatient.id})
          </span>
        </h4>
        
        {/* Upload section */}
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h6 style={{ marginTop: 0, marginBottom: '10px' }}>Ajouter une radiographie</h6>
          <textarea
            placeholder="Description (optionnel)"
            rows="2"
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
            value={newRadiographie.description}
            onChange={(e) => setNewRadiographie({ ...newRadiographie, description: e.target.value })}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ marginBottom: '10px', display: 'block' }}
          />
          <button
            onClick={handleLocalUpload}
            disabled={uploading}
            style={{
              width: '100%',
              padding: '10px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <FaUpload /> {uploading ? 'Upload en cours...' : 'Uploader la radiographie'}
          </button>
        </div>
        
        {/* Liste des radiographies */}
        <div>
          <h6>Radiographies existantes ({radiographies.length})</h6>
          {radiographies.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>Aucune radiographie</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
              {radiographies.map(radio => (
                <div key={radio.id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                  <img 
    src={`http://localhost:5000${radio.image_url}`} 
    alt="Radiographie"
    style={{ width: '100%', height: '150px', objectFit: 'cover', cursor: 'pointer' }}
    onClick={() => window.open(`http://localhost:5000${radio.image_url}`, '_blank')}
/>
                  <div style={{ padding: '10px' }}>
                    <p style={{ fontSize: '12px', marginBottom: '5px', wordBreak: 'break-word' }}>
                      {radio.description || 'Sans description'}
                    </p>
                    <p style={{ fontSize: '10px', color: '#6c757d', marginBottom: '8px' }}>
                      {new Date(radio.uploaded_at).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => handleDeleteRadiographie(radio.id)}
                      style={{
                        width: '100%',
                        padding: '5px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <FaTrash size={10} /> Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={() => {
            setShowRadiographieModal(false);
            setNewRadiographie({ patient_id: '', description: '', image: null });
          }}
          style={{
            width: '100%',
            padding: '10px',
            marginTop: '20px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default RadiographieModal;