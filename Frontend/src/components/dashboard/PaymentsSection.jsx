// src/components/dashboard/PaymentsSection.jsx - VERSION MODIFIÉE
import React, { useState } from 'react';
import { FaMoneyBill, FaDollarSign, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaMoneyBillWave, FaRegCreditCard, FaHistory } from 'react-icons/fa';
import PaymentHistorySection from './PaymentHistorySection';

const PaymentsSection = ({ patients, setSelectedPatientForPaiement, setShowPaiementModal, refreshData }) => {
  const [activeSubTab, setActiveSubTab] = useState('current'); // 'current' ou 'history'

  // Calcul des statistiques (reste identique)
  const totalGlobal = patients.reduce((total, patient) => {
    return total + (parseFloat(patient.montant_total) || 0);
  }, 0);

  const totalPaye = patients.reduce((total, patient) => {
    return total + (parseFloat(patient.montant_paye) || 0);
  }, 0);

  const totalRestant = patients.reduce((total, patient) => {
    return total + (parseFloat(patient.montant_restant) || 0);
  }, 0);

  const stats = {
    total: totalGlobal,
    paye: totalPaye,
    restant: totalRestant,
    payeCount: patients.filter(p => p.paiement_status === 'paye').length,
    semiPayeCount: patients.filter(p => p.paiement_status === 'semi_paye').length,
    nonPayeCount: patients.filter(p => p.paiement_status === 'non_paye' && (parseFloat(p.montant_total) || 0) > 0).length
  };

  const getTypePaiementDisplay = (patient) => {
    const type = patient.type_paiement || 'espece';
    
    if (type === 'espece') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '13px',
          color: '#28a745'
        }}>
          <FaMoneyBillWave /> Espèces
        </span>
      );
    } else if (type === 'cheque') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '13px',
          color: '#17a2b8'
        }}>
          <FaRegCreditCard /> Chèque
          {patient.cheque_info?.numero && (
            <small style={{ color: '#6c757d', marginLeft: '3px' }}>
              (N°{patient.cheque_info.numero})
            </small>
          )}
        </span>
      );
    } else {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '13px',
          color: '#6c757d'
        }}>
          Non défini
        </span>
      );
    }
  };

  const handleManagePayment = (patient) => {
    console.log(`📝 Gestion paiement pour: ${patient.full_name}, type actuel: ${patient.type_paiement}`);
    setSelectedPatientForPaiement(patient);
    setShowPaiementModal(true);
  };

  return (
    <div>
      {/* Onglets */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '25px',
        borderBottom: '1px solid #dee2e6',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => setActiveSubTab('current')}
          style={{
            padding: '10px 20px',
            background: activeSubTab === 'current' ? '#667eea' : 'transparent',
            color: activeSubTab === 'current' ? 'white' : '#6c757d',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            transition: 'all 0.3s'
          }}
        >
          <FaMoneyBillWave /> Paiements actuels
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          style={{
            padding: '10px 20px',
            background: activeSubTab === 'history' ? '#28a745' : 'transparent',
            color: activeSubTab === 'history' ? 'white' : '#6c757d',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            transition: 'all 0.3s'
          }}
        >
          <FaHistory /> Historique des paiements
        </button>
      </div>

      {/* Contenu selon l'onglet sélectionné */}
      {activeSubTab === 'current' ? (
        <>
          {/* Statistiques des paiements - identique à l'original */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', borderRadius: '15px', color: 'white' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '28px' }}>{stats.total.toFixed(2)} DT</h3>
                <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Montant total global</p>
                <small>{patients.length} patients</small>
              </div>
            </div>
            
            <div style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', padding: '20px', borderRadius: '15px', color: 'white' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '28px' }}>{stats.paye.toFixed(2)} DT</h3>
                <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Total encaissé</p>
                <small>{stats.payeCount} patients payés</small>
              </div>
            </div>
            
            <div style={{ background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)', padding: '20px', borderRadius: '15px', color: 'white' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '28px' }}>{stats.restant.toFixed(2)} DT</h3>
                <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Total restant</p>
                <small>{stats.nonPayeCount + stats.semiPayeCount} patients avec solde</small>
              </div>
            </div>
          </div>

          {/* Liste des patients avec statut de paiement - identique à l'original */}
          <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden' }}>
            <h5 style={{ padding: '20px', margin: 0, borderBottom: '1px solid #eee' }}>
              <FaDollarSign style={{ marginRight: '10px' }} /> Détail des paiements par patient
            </h5>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Patient</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Téléphone</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Montant total</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Montant payé</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Reste à payer</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Mode de paiement</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Statut</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient, index) => {
                    const montantTotal = parseFloat(patient.montant_total) || 0;
                    const montantPaye = parseFloat(patient.montant_paye) || 0;
                    const resteAPayer = patient.montant_restant || (montantTotal - montantPaye);
                    
                    return (
                      <tr key={patient.id} style={{ borderBottom: index !== patients.length - 1 ? '1px solid #eee' : 'none' }}>
                        <td style={{ padding: '12px', fontWeight: '500' }}>{patient.full_name}</td>
                        <td style={{ padding: '12px' }}>{patient.phone || '-'}</td>
                        <td style={{ padding: '12px' }}><strong>{montantTotal.toFixed(2)} DT</strong></td>
                        <td style={{ padding: '12px', color: '#28a745' }}>{montantPaye.toFixed(2)} DT</td>
                        <td style={{ padding: '12px' }}>
                          <strong style={{ color: resteAPayer > 0 ? '#dc3545' : '#28a745', fontSize: '16px' }}>
                            {Math.max(0, resteAPayer).toFixed(2)} DT
                          </strong>
                        </td>
                        <td style={{ padding: '12px' }}>
                          {getTypePaiementDisplay(patient)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: patient.paiement_status === 'paye' ? '#d4edda' : 
                                       (patient.paiement_status === 'semi_paye' ? '#fff3cd' : '#f8d7da'),
                            color: patient.paiement_status === 'paye' ? '#155724' : 
                                   (patient.paiement_status === 'semi_paye' ? '#856404' : '#721c24'),
                            padding: '6px 15px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            {patient.paiement_status === 'paye' ? <FaCheckCircle /> : 
                             (patient.paiement_status === 'semi_paye' ? <FaExclamationTriangle /> : <FaTimesCircle />)}
                            {patient.paiement_status === 'paye' ? ' Payé' : 
                             (patient.paiement_status === 'semi_paye' ? ' Semi-payé' : ' Non payé')}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => handleManagePayment(patient)}
                            style={{
                              padding: '8px 16px',
                              background: '#667eea',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <FaMoneyBill /> Gérer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <PaymentHistorySection />
      )}
    </div>
  );
};

export default PaymentsSection;