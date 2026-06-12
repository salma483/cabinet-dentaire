import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTooth, FaEnvelope, FaLock, FaUserMd } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Connexion réussie ! Bienvenue Dr. Ayadi');
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Toaster position="top-right" />
      <div style={{
        background: 'white',
        borderRadius: '30px',
        padding: '60px 50px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '580px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderRadius: '50%',
            display: 'inline-flex',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <FaTooth size={60} color="#667eea" />
          </div>
          <h2 style={{ color: '#667eea', fontWeight: 'bold', fontSize: '32px', marginBottom: '10px' }}>Dr. Neder Ayadi</h2>
          <p style={{ color: '#6c757d', fontSize: '18px' }}>Dashboard Dentaire Professionnel</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: '#495057', marginBottom: '10px', display: 'block', fontWeight: '500', fontSize: '15px' }}>Email professionnel</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }}>
                <FaEnvelope color="#6c757d" size={18} />
              </div>
              <input
                type="email"
                style={{
                  width: '100%',
                  padding: '14px 15px 14px 45px',
                  border: '2px solid #dee2e6',
                  borderRadius: '12px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease'
                }}
                placeholder="dr.ayadineder@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '35px' }}>
            <label style={{ color: '#495057', marginBottom: '10px', display: 'block', fontWeight: '500', fontSize: '15px' }}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }}>
                <FaLock color="#6c757d" size={18} />
              </div>
              <input
                type="password"
                style={{
                  width: '100%',
                  padding: '14px 15px 14px 45px',
                  border: '2px solid #dee2e6',
                  borderRadius: '12px',
                  fontSize: '16px',
                  transition: 'all 0.3s ease'
                }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '30px', paddingTop: '25px', borderTop: '1px solid #e9ecef' }}>
          <small style={{ color: '#6c757d', fontSize: '14px' }}>
            <FaUserMd style={{ marginRight: '8px' }} /> Cabinet Dentaire Dr. Ayadi - Tunisie
          </small>
        </div>
      </div>
    </div>
  );
};

export default Login;