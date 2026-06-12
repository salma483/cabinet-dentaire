// src/components/dashboard/PaymentHistorySection.jsx
import React, { useState, useEffect } from 'react';
import { FaHistory, FaSearch, FaPrint, FaDownload, FaEye, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import toast from 'react-hot-toast';

const PaymentHistorySection = () => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState('');
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetchPaymentHistory();
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/patients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error('Erreur chargement patients:', error);
    }
  };

  const fetchPaymentHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/paiements/historique-complet', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data);
        setFilteredHistory(data);
      } else {
        // Si l'endpoint n'existe pas encore, on récupère par patient
        console.log('Endpoint historique complet non disponible, utilisation alternative');
        setPaymentHistory([]);
        setFilteredHistory([]);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      toast.error('Erreur lors du chargement de l\'historique');
      setPaymentHistory([]);
      setFilteredHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer l'historique
  useEffect(() => {
    let filtered = [...paymentHistory];
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.patient_phone?.includes(searchTerm) ||
        item.user_action?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (dateFilter) {
      filtered = filtered.filter(item => 
        item.created_at?.split('T')[0] === dateFilter
      );
    }
    
    setFilteredHistory(filtered);
    setCurrentPage(1);
  }, [searchTerm, dateFilter, paymentHistory]);

  const getStatutBadge = (statut) => {
    const statusConfig = {
      'paye': { color: '#28a745', bg: '#d4edda', text: 'Payé' },
      'semi_paye': { color: '#856404', bg: '#fff3cd', text: 'Semi-payé' },
      'non_paye': { color: '#721c24', bg: '#f8d7da', text: 'Non payé' }
    };
    const config = statusConfig[statut] || statusConfig['non_paye'];
    return (
      <span style={{
        background: config.bg,
        color: config.color,
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {config.text}
      </span>
    );
  };

  const getTypePaiementDisplay = (type, chequeInfo) => {
    if (type === 'espece') {
      return <span style={{ color: '#28a745' }}>💰 Espèces</span>;
    } else if (type === 'cheque') {
      let chequeText = '📝 Chèque';
      if (chequeInfo) {
        try {
          const info = typeof chequeInfo === 'string' ? JSON.parse(chequeInfo) : chequeInfo;
          if (info.numero) chequeText += ` N°${info.numero}`;
        } catch(e) {}
      }
      return <span style={{ color: '#17a2b8' }}>{chequeText}</span>;
    }
    return <span style={{ color: '#6c757d' }}>Non spécifié</span>;
  };

  const handleViewDetails = (item) => {
    setSelectedPatient(item);
    setShowDetailsModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const headers = ['Date', 'Patient', 'Téléphone', 'Montant Total', 'Montant Payé', 'Montant Restant', 'Statut', 'Mode Paiement', 'Utilisateur', 'Notes'];
    const csvData = filteredHistory.map(item => [
      new Date(item.created_at).toLocaleString(),
      item.patient_name || '',
      item.patient_phone || '',
      item.montant_total_apres || item.montant_total || 0,
      item.montant_paye_apres || item.montant_paye || 0,
      item.montant_restant_apres || item.montant_restant || 0,
      item.statut_apres || item.statut || '',
      item.type_paiement_apres || item.type_paiement || '',
      item.user_action || '',
      item.notes || ''
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique_paiements_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV réussi');
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  // Calcul des statistiques
  const stats = {
    total_transactions: paymentHistory.length,
    total_montant: paymentHistory.reduce((sum, item) => sum + (parseFloat(item.montant_total_apres || item.montant_total) || 0), 0),
    total_paye: paymentHistory.reduce((sum, item) => sum + (parseFloat(item.montant_paye_apres || item.montant_paye) || 0), 0),
    total_restant: paymentHistory.reduce((sum, item) => sum + (parseFloat(item.montant_restant_apres || item.montant_restant) || 0), 0)
  };

  return (
    <div>
      {/* En-tête avec statistiques */}
      <div style={{ marginBottom: '25px' }}>
        <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaHistory /> Historique complet des paiements
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '15px', borderRadius: '12px', color: 'white' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total_transactions}</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Transactions totales</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', padding: '15px', borderRadius: '12px', color: 'white' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total_montant.toFixed(2)} DT</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Montant total</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)', padding: '15px', borderRadius: '12px', color: 'white' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total_paye.toFixed(2)} DT</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Total encaissé</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)', padding: '15px', borderRadius: '12px', color: 'white' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total_restant.toFixed(2)} DT</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Total restant</div>
          </div>
        </div>
      </div>

      {/* Filtres et actions */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '12px', 
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '15px',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '15px', flex: 1, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }} />
            <input
              type="text"
              placeholder="Rechercher par patient, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 35px',
                borderRadius: '8px',
                border: '1px solid #ced4da',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ced4da',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '8px 15px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <FaPrint /> Imprimer
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: '8px 15px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <FaDownload /> Exporter CSV
          </button>
          <button
            onClick={fetchPaymentHistory}
            style={{
              padding: '8px 15px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Tableau de l'historique */}
      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '15px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Patient</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Contact</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Montant Total</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Payé</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Reste</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Statut</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Mode</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Utilisateur</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '50px' }}>
                    <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                    Chargement...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '50px', color: '#6c757d' }}>
                    <FaHistory style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.5 }} />
                    <p>Aucune transaction trouvée</p>
                  </td>
                </tr>
              ) : (
                currentItems.map((item, index) => (
                  <tr key={index} style={{ borderBottom: index !== currentItems.length - 1 ? '1px solid #eee' : 'none' }}>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontWeight: '500' }}>
                      {item.patient_name || `Patient #${item.patient_id}`}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      {item.patient_phone || '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <strong>{(item.montant_total_apres || item.montant_total || 0).toFixed(2)} DT</strong>
                    </td>
                    <td style={{ padding: '12px', color: '#28a745' }}>
                      {(item.montant_paye_apres || item.montant_paye || 0).toFixed(2)} DT
                    </td>
                    <td style={{ padding: '12px', color: '#dc3545' }}>
                      {(item.montant_restant_apres || item.montant_restant || 0).toFixed(2)} DT
                    </td>
                    <td style={{ padding: '12px' }}>
                      {getStatutBadge(item.statut_apres || item.statut)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {getTypePaiementDisplay(item.type_paiement_apres || item.type_paiement, item.cheque_info_apres || item.cheque_info)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px' }}>
                      {item.user_action || '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleViewDetails(item)}
                        style={{
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        <FaEye /> Détails
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '20px' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                background: currentPage === 1 ? '#e9ecef' : '#667eea',
                color: currentPage === 1 ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <FaChevronLeft />
            </button>
            <span style={{ padding: '8px 12px' }}>
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                background: currentPage === totalPages ? '#e9ecef' : '#667eea',
                color: currentPage === totalPages ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* Modal Détails */}
      {showDetailsModal && selectedPatient && (
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
              <h4 style={{ margin: 0 }}>Détails de la transaction</h4>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <strong>Date:</strong> {new Date(selectedPatient.created_at).toLocaleString()}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Patient:</strong> {selectedPatient.patient_name || `Patient #${selectedPatient.patient_id}`}
            </div>
            {selectedPatient.patient_phone && (
              <div style={{ marginBottom: '10px' }}>
                <strong>Téléphone:</strong> {selectedPatient.patient_phone}
              </div>
            )}
            <div style={{ marginBottom: '10px' }}>
              <strong>Montant avant modification:</strong> {selectedPatient.montant_total_avant?.toFixed(2) || 0} DT
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Montant après modification:</strong> {selectedPatient.montant_total_apres?.toFixed(2) || selectedPatient.montant_total?.toFixed(2) || 0} DT
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Montant payé:</strong> {selectedPatient.montant_paye_apres?.toFixed(2) || selectedPatient.montant_paye?.toFixed(2) || 0} DT
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Montant restant:</strong> {selectedPatient.montant_restant_apres?.toFixed(2) || selectedPatient.montant_restant?.toFixed(2) || 0} DT
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Statut:</strong> {getStatutBadge(selectedPatient.statut_apres || selectedPatient.statut)}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Mode paiement:</strong> {getTypePaiementDisplay(selectedPatient.type_paiement_apres || selectedPatient.type_paiement, selectedPatient.cheque_info_apres || selectedPatient.cheque_info)}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Utilisateur:</strong> {selectedPatient.user_action || '-'}
            </div>
            {selectedPatient.notes && (
              <div style={{ marginBottom: '10px' }}>
                <strong>Notes:</strong> {selectedPatient.notes}
              </div>
            )}
            
            <button
              onClick={() => setShowDetailsModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media print {
          .no-print { display: none; }
          body { print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default PaymentHistorySection;