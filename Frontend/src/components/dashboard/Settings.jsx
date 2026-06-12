// src/components/dashboard/Settings.jsx
import React, { useState } from 'react';
import { FaSave, FaKey, FaEnvelope, FaUser, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';

const Settings = ({ user, onUpdate }) => {
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation des mots de passe
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.put(
        'http://localhost:5000/api/auth/profile',
        {
          email: email !== user?.email ? email : undefined,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Profil mis à jour avec succès');
        
        // Mettre à jour les informations dans localStorage
        const updatedUser = { ...user, ...response.data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Appeler la fonction de callback pour mettre à jour l'état parent
        if (onUpdate) {
          onUpdate(updatedUser);
        }
        
        // Réinitialiser les champs de mot de passe
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaShieldAlt color="#667eea" /> Paramètres du compte
          </h3>
          <p style={{ color: '#6c757d', marginTop: '5px' }}>
            Gérez vos informations personnelles et votre sécurité
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section Email */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ 
              marginBottom: '20px', 
              paddingBottom: '10px', 
              borderBottom: '2px solid #f0f2f5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaEnvelope color="#667eea" /> Informations de connexion
            </h4>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#495057'
              }}>
                <FaUser style={{ marginRight: '5px' }} /> Nom complet
              </label>
              <input
                type="text"
                value={user?.full_name || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '2px solid #e9ecef',
                  borderRadius: '10px',
                  background: '#f8f9fa',
                  color: '#6c757d'
                }}
              />
              <small style={{ color: '#6c757d' }}>Le nom ne peut pas être modifié</small>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#495057'
              }}>
                <FaEnvelope style={{ marginRight: '5px' }} /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '2px solid #dee2e6',
                  borderRadius: '10px',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
              />
            </div>
          </div>

          {/* Section Mot de passe */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ 
              marginBottom: '20px', 
              paddingBottom: '10px', 
              borderBottom: '2px solid #f0f2f5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaKey color="#667eea" /> Changer le mot de passe
            </h4>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#495057'
              }}>
                Mot de passe actuel
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '2px solid #dee2e6',
                  borderRadius: '10px',
                  fontSize: '14px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#495057'
              }}>
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '2px solid #dee2e6',
                  borderRadius: '10px',
                  fontSize: '14px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#495057'
              }}>
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre mot de passe"
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '2px solid #dee2e6',
                  borderRadius: '10px',
                  fontSize: '14px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
              />
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div style={{ borderTop: '1px solid #e9ecef', paddingTop: '20px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <FaSave /> {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;