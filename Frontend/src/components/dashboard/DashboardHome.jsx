// src/components/dashboard/DashboardHome.jsx

// À la place du code actuel, voici une version simplifiée SANS BI :

import React, { useMemo } from 'react';
import { FaUsers, FaUserPlus, FaCalendarAlt, FaDollarSign, FaRegClock, FaChild, FaUser, FaUserGraduate, FaTrophy } from 'react-icons/fa';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const DashboardHome = ({ 
    stats, 
    patients, 
    todayAppointments, 
    setDateFilter, 
    setActiveTab, 
    setShowAppointmentModal, 
    setNewAppointment
}) => {
    
    // Statistiques des paiements (simplifié)
    const paymentStats = useMemo(() => {
        const payes = patients.filter(p => p.paiement_status === 'paye').length;
        const semiPayes = patients.filter(p => p.paiement_status === 'semi_paye').length;
        const nonPayes = patients.filter(p => p.paiement_status === 'non_paye').length;
        const totalMontant = patients.reduce((sum, p) => sum + (parseFloat(p.montant_total) || 0), 0);
        const totalPaye = patients.reduce((sum, p) => sum + (parseFloat(p.montant_paye) || 0), 0);
        const totalRestant = patients.reduce((sum, p) => sum + (parseFloat(p.montant_restant) || 0), 0);
        
        return { payes, semiPayes, nonPayes, totalMontant, totalPaye, totalRestant };
    }, [patients]);

    // Ranking des patients (top 5)
    const patientRanking = useMemo(() => {
        return [...patients]
            .sort((a, b) => (parseFloat(b.montant_total) || 0) - (parseFloat(a.montant_total) || 0))
            .slice(0, 5)
            .map((p, index) => ({
                rank: index + 1,
                name: p.full_name || p.nom || 'Patient',
                total: parseFloat(p.montant_total) || 0,
                status: p.paiement_status
            }));
    }, [patients]);

    return (
        <>
            {/* ============ KPI CARDS ============ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', borderRadius: '15px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: '0 0 5px 0', opacity: 0.9, fontSize: '14px' }}>Total Patients</p>
                            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{patients.length}</h2>
                        </div>
                        <FaUsers size={40} style={{ opacity: 0.7 }} />
                    </div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', padding: '20px', borderRadius: '15px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: '0 0 5px 0', opacity: 0.9, fontSize: '14px' }}>Patients payés</p>
                            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{paymentStats.payes}</h2>
                        </div>
                        <FaDollarSign size={40} style={{ opacity: 0.7 }} />
                    </div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)', padding: '20px', borderRadius: '15px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: '0 0 5px 0', opacity: 0.9, fontSize: '14px' }}>Rendez-vous aujourd'hui</p>
                            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{todayAppointments.length}</h2>
                        </div>
                        <FaCalendarAlt size={40} style={{ opacity: 0.7 }} />
                    </div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)', padding: '20px', borderRadius: '15px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: '0 0 5px 0', opacity: 0.9, fontSize: '14px' }}>Chiffre d'affaires</p>
                            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{paymentStats.totalPaye.toFixed(0)} DT</h2>
                        </div>
                        <FaDollarSign size={40} style={{ opacity: 0.7 }} />
                    </div>
                </div>
            </div>

            {/* ============ TOP PATIENTS ============ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                {/* Top Patients */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h5 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#333' }}>
                        <FaTrophy style={{ color: '#ffc107' }} /> Top 5 Patients (par montant total)
                    </h5>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#666', fontSize: '13px' }}>Rang</th>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#666', fontSize: '13px' }}>Patient</th>
                                <th style={{ textAlign: 'right', padding: '12px 8px', color: '#666', fontSize: '13px' }}>Montant Total</th>
                                <th style={{ textAlign: 'center', padding: '12px 8px', color: '#666', fontSize: '13px' }}>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patientRanking.map((patient) => (
                                <tr key={patient.rank} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '12px 8px' }}>
                                        <span style={{ 
                                            display: 'inline-block', 
                                            width: '28px', 
                                            height: '28px', 
                                            lineHeight: '28px', 
                                            textAlign: 'center',
                                            borderRadius: '50%',
                                            background: patient.rank === 1 ? '#ffd700' : patient.rank === 2 ? '#c0c0c0' : patient.rank === 3 ? '#cd7f32' : '#f0f0f0',
                                            color: patient.rank <= 3 ? '#fff' : '#666',
                                            fontWeight: 'bold',
                                            fontSize: '13px'
                                        }}>
                                            {patient.rank}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 8px', fontWeight: '500', color: '#333' }}>{patient.name}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#667eea' }}>{patient.total.toFixed(2)} DT</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            background: patient.status === 'paye' ? '#d4edda' : patient.status === 'semi_paye' ? '#fff3cd' : '#f8d7da',
                                            color: patient.status === 'paye' ? '#155724' : patient.status === 'semi_paye' ? '#856404' : '#721c24'
                                        }}>
                                            {patient.status === 'paye' ? 'Payé' : patient.status === 'semi_paye' ? 'Semi-payé' : 'Non payé'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Statistiques des paiements */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h5 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#333' }}>
                        <FaDollarSign style={{ color: '#28a745' }} /> Distribution des paiements
                    </h5>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
                        {/* Pie Chart simple */}
                        <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                                {(() => {
                                    const total = paymentStats.payes + paymentStats.semiPayes + paymentStats.nonPayes;
                                    if (total === 0) return <circle cx="50" cy="50" r="40" fill="#e9ecef" />;
                                    
                                    let startAngle = 0;
                                    const segments = [
                                        { value: paymentStats.payes, color: '#28a745', label: 'Payés' },
                                        { value: paymentStats.semiPayes, color: '#ffc107', label: 'Semi-payés' },
                                        { value: paymentStats.nonPayes, color: '#dc3545', label: 'Non payés' }
                                    ];
                                    
                                    return segments.map((segment, index) => {
                                        const angle = (segment.value / total) * 360;
                                        if (angle === 0) return null;
                                        
                                        const endAngle = startAngle + angle;
                                        const startRad = (startAngle * Math.PI) / 180;
                                        const endRad = (endAngle * Math.PI) / 180;
                                        
                                        const x1 = 50 + 40 * Math.cos(startRad);
                                        const y1 = 50 + 40 * Math.sin(startRad);
                                        const x2 = 50 + 40 * Math.cos(endRad);
                                        const y2 = 50 + 40 * Math.sin(endRad);
                                        
                                        const largeArc = angle > 180 ? 1 : 0;
                                        const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
                                        
                                        startAngle = endAngle;
                                        return <path key={index} d={pathData} fill={segment.color} stroke="white" strokeWidth="2" />;
                                    });
                                })()}
                                <circle cx="50" cy="50" r="25" fill="white" />
                            </svg>
                        </div>
                        
                        {/* Legend */}
                        <div>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <div style={{ width: '16px', height: '16px', background: '#28a745', borderRadius: '4px' }}></div>
                                    <span style={{ fontSize: '14px', color: '#333' }}>Payés</span>
                                    <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#28a745' }}>{paymentStats.payes}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <div style={{ width: '16px', height: '16px', background: '#ffc107', borderRadius: '4px' }}></div>
                                    <span style={{ fontSize: '14px', color: '#333' }}>Semi-payés</span>
                                    <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#ffc107' }}>{paymentStats.semiPayes}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <div style={{ width: '16px', height: '16px', background: '#dc3545', borderRadius: '4px' }}></div>
                                    <span style={{ fontSize: '14px', color: '#333' }}>Non payés</span>
                                    <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#dc3545' }}>{paymentStats.nonPayes}</span>
                                </div>
                            </div>
                            <hr style={{ margin: '15px 0' }} />
                            <div>
                                <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Total encaissé</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>{paymentStats.totalPaye.toFixed(2)} DT</div>
                                <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>Reste à payer</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc3545' }}>{paymentStats.totalRestant.toFixed(2)} DT</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DashboardHome;