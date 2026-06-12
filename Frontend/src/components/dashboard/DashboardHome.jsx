// src/components/dashboard/DashboardHome.jsx
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
    
    // ============ CALCULS BI DIRECTEMENT DANS LE FRONTEND ============
    
    // Statistiques des nouveaux patients
    const newPatientsStats = useMemo(() => {
        const patientsWithDate = patients.filter(p => p.created_at);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        const nouveauxCeMois = patientsWithDate.filter(p => {
            const date = new Date(p.created_at);
            return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
        }).length;
        
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const nouveauxMoisDernier = patientsWithDate.filter(p => {
            const date = new Date(p.created_at);
            return date.getFullYear() === lastMonthYear && date.getMonth() === lastMonth;
        }).length;
        
        let variation = 0;
        if (nouveauxMoisDernier > 0) {
            variation = ((nouveauxCeMois - nouveauxMoisDernier) / nouveauxMoisDernier * 100).toFixed(1);
        } else if (nouveauxCeMois > 0) {
            variation = 100;
        }
        
        const moisMap = new Map();
        patientsWithDate.forEach(p => {
            const date = new Date(p.created_at);
            const moisKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            const moisNom = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
            
            if (!moisMap.has(moisKey)) {
                moisMap.set(moisKey, { mois: moisKey, mois_nom: moisNom, total: 0 });
            }
            moisMap.get(moisKey).total++;
        });
        
        const topMois = Array.from(moisMap.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
        
        const evolution = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const count = patientsWithDate.filter(p => {
                const pDate = new Date(p.created_at);
                return pDate.getFullYear() === date.getFullYear() && pDate.getMonth() === date.getMonth();
            }).length;
            evolution.push({
                mois: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
                nouveaux_patients: count
            });
        }
        
        return {
            total: patients.length,
            ce_mois: nouveauxCeMois,
            mois_dernier: nouveauxMoisDernier,
            variation: variation,
            isPositive: variation >= 0,
            top_mois: topMois,
            evolution: evolution
        };
    }, [patients]);
    
    // Statistiques par âge directement depuis patients
    const ageStats = useMemo(() => {
        const enfants = patients.filter(p => p.age && p.age < 18).length;
        const adultes = patients.filter(p => p.age && p.age >= 18 && p.age < 65).length;
        const seniors = patients.filter(p => p.age && p.age >= 65).length;
        return { enfants, adultes, seniors };
    }, [patients]);
    
    // Statistiques des paiements
    const paymentStats = useMemo(() => {
        const payes = patients.filter(p => p.paiement_status === 'paye').length;
        const semiPayes = patients.filter(p => p.paiement_status === 'semi_paye').length;
        const nonPayes = patients.filter(p => p.paiement_status === 'non_paye').length;
        const totalMontant = patients.reduce((sum, p) => sum + (parseFloat(p.montant_total) || 0), 0);
        const totalPaye = patients.reduce((sum, p) => sum + (parseFloat(p.montant_paye) || 0), 0);
        const totalRestant = patients.reduce((sum, p) => sum + (parseFloat(p.montant_restant) || 0), 0);
        
        return { payes, semiPayes, nonPayes, totalMontant, totalPaye, totalRestant };
    }, [patients]);

    // Ranking des patients (top 5 par montant total)
    const patientRanking = useMemo(() => {
        return [...patients]
            .sort((a, b) => (parseFloat(b.montant_total) || 0) - (parseFloat(a.montant_total) || 0))
            .slice(0, 5)
            .map((p, index) => ({
                rank: index + 1,
                name: p.nom,
                total: parseFloat(p.montant_total) || 0,
                status: p.paiement_status
            }));
    }, [patients]);

    // Ranking des paiements par statut
    const paymentRanking = useMemo(() => {
        const statusMap = {
            'paye': { label: 'Payé', color: '#28a745', count: paymentStats.payes, percentage: ((paymentStats.payes / patients.length) * 100).toFixed(1) },
            'semi_paye': { label: 'Semi-payé', color: '#ffc107', count: paymentStats.semiPayes, percentage: ((paymentStats.semiPayes / patients.length) * 100).toFixed(1) },
            'non_paye': { label: 'Non payé', color: '#dc3545', count: paymentStats.nonPayes, percentage: ((paymentStats.nonPayes / patients.length) * 100).toFixed(1) }
        };
        return Object.entries(statusMap).map(([key, value]) => value);
    }, [paymentStats, patients.length]);

    return (
        <>
            {/* ============ KPI CARDS EN HAUT DE PAGE ============ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                {/* Carte Total Patients */}
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', borderRadius: '15px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: '0 0 5px 0', opacity: 0.9, fontSize: '14px' }}>Total Patients</p>
                            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{patients.length}</h2>
                        </div>
                        <FaUsers size={40} style={{ opacity: 0.7 }} />
                    </div>
                </div>

                {/* Carte Nouveaux ce mois */}
                <div style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', padding: '20px', borderRadius: '15px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: '0 0 5px 0', opacity: 0.9, fontSize: '14px' }}>Nouveaux ce mois</p>
                            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{newPatientsStats.ce_mois}</h2>
                            <p style={{ margin: '5px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
                                {newPatientsStats.isPositive ? '▲' : '▼'} {Math.abs(newPatientsStats.variation)}% vs mois dernier
                            </p>
                        </div>
                        <FaUserPlus size={40} style={{ opacity: 0.7 }} />
                    </div>
                </div>

                {/* Carte Rendez-vous aujourd'hui */}
                <div style={{ background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)', padding: '20px', borderRadius: '15px', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: '0 0 5px 0', opacity: 0.9, fontSize: '14px' }}>Rendez-vous aujourd'hui</p>
                            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{todayAppointments.length}</h2>
                        </div>
                        <FaCalendarAlt size={40} style={{ opacity: 0.7 }} />
                    </div>
                </div>

                {/* Carte Chiffre d'affaires */}
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

            {/* ============ SECTION NOUVEAUX PATIENTS (BAR CHART À GAUCHE + RANKING TABLE À DROITE) ============ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                {/* Bar Chart - Nouveaux Patients (Évolution sur 6 mois) */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h5 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#333' }}>
                        <FaUserPlus style={{ color: '#667eea' }} /> Nouveaux Patients - Évolution (6 derniers mois)
                    </h5>
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '250px', padding: '20px 0' }}>
                        {newPatientsStats.evolution.slice(-6).map((item, idx) => {
                            const maxValue = Math.max(...newPatientsStats.evolution.slice(-6).map(e => e.nouveaux_patients), 1);
                            const height = (item.nouveaux_patients / maxValue) * 200;
                            return (
                                <div key={idx} style={{ textAlign: 'center', width: '60px' }}>
                                    <div style={{ 
                                        height: `${height}px`, 
                                        background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                                        borderRadius: '10px 10px 0 0',
                                        width: '40px',
                                        margin: '0 auto',
                                        transition: 'height 0.3s ease',
                                        position: 'relative'
                                    }}>
                                        <span style={{ 
                                            position: 'absolute', 
                                            top: '-25px', 
                                            left: '50%', 
                                            transform: 'translateX(-50%)',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            color: '#667eea'
                                        }}>
                                            {item.nouveaux_patients}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', marginTop: '10px', color: '#666' }}>
                                        {item.mois?.substring(5)}/{item.mois?.substring(2, 4)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Ranking Table - Top Patients */}
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
            </div>

            {/* ============ SECTION STATISTIQUES DES PAIEMENTS (PIE CHART À GAUCHE + RANKING TABLE À DROITE) ============ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                {/* Pie Chart - Statistiques des paiements */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h5 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#333' }}>
                        <FaDollarSign style={{ color: '#28a745' }} /> Distribution des paiements
                    </h5>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
                        {/* Simple Pie Chart representation using CSS cones */}
                        <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                                {(() => {
                                    const total = paymentStats.payes + paymentStats.semiPayes + paymentStats.nonPayes;
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

                {/* Ranking Table - Statut des paiements */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <h5 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#333' }}>
                        <FaDollarSign style={{ color: '#ffc107' }} /> Classement par statut de paiement
                    </h5>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#666', fontSize: '13px' }}>Statut</th>
                                <th style={{ textAlign: 'right', padding: '12px 8px', color: '#666', fontSize: '13px' }}>Nombre</th>
                                <th style={{ textAlign: 'right', padding: '12px 8px', color: '#666', fontSize: '13px' }}>Pourcentage</th>
                                <th style={{ textAlign: 'right', padding: '12px 8px', color: '#666', fontSize: '13px' }}>Montant total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '12px 8px' }}>
                                    <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#28a745', borderRadius: '50%', marginRight: '8px' }}></span>
                                    <span style={{ fontWeight: '500' }}>Payé</span>
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>{paymentStats.payes}</td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#28a745', fontWeight: 'bold' }}>
                                    {((paymentStats.payes / patients.length) * 100).toFixed(1)}%
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#28a745' }}>
                                    {patients.filter(p => p.paiement_status === 'paye').reduce((sum, p) => sum + (parseFloat(p.montant_paye) || 0), 0).toFixed(2)} DT
                                </td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '12px 8px' }}>
                                    <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#ffc107', borderRadius: '50%', marginRight: '8px' }}></span>
                                    <span style={{ fontWeight: '500' }}>Semi-payé</span>
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>{paymentStats.semiPayes}</td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#ffc107', fontWeight: 'bold' }}>
                                    {((paymentStats.semiPayes / patients.length) * 100).toFixed(1)}%
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#ffc107' }}>
                                    {patients.filter(p => p.paiement_status === 'semi_paye').reduce((sum, p) => sum + (parseFloat(p.montant_paye) || 0), 0).toFixed(2)} DT
                                </td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '12px 8px' }}>
                                    <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#dc3545', borderRadius: '50%', marginRight: '8px' }}></span>
                                    <span style={{ fontWeight: '500' }}>Non payé</span>
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>{paymentStats.nonPayes}</td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#dc3545', fontWeight: 'bold' }}>
                                    {((paymentStats.nonPayes / patients.length) * 100).toFixed(1)}%
                                </td>
                                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#dc3545' }}>
                                    {patients.filter(p => p.paiement_status === 'non_paye').reduce((sum, p) => sum + (parseFloat(p.montant_total) || 0), 0).toFixed(2)} DT
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    {/* Total général */}
                    <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: '#333' }}>Total général</span>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>{paymentStats.totalMontant.toFixed(2)} DT</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>dont {paymentStats.totalPaye.toFixed(2)} DT encaissés</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DashboardHome;