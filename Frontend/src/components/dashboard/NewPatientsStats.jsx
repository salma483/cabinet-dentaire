// src/components/dashboard/NewPatientsStats.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserPlus, FaChartLine, FaCalendarAlt, FaChild, FaUser, FaUserGraduate } from 'react-icons/fa';
import toast from 'react-hot-toast';

const NewPatientsStats = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: { total: 0, ce_mois: 0, mois_dernier: 0 },
        par_periode: [],
        top_mois: []
    });

    const token = localStorage.getItem('token');
    const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                'http://localhost:5000/api/patients/bi/new-patients?periode=mois',
                axiosConfig
            );
            
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Erreur chargement stats nouveaux patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const getVariation = () => {
        if (stats.total.mois_dernier > 0) {
            const variation = ((stats.total.ce_mois - stats.total.mois_dernier) / stats.total.mois_dernier * 100).toFixed(1);
            return variation;
        }
        return stats.total.ce_mois > 0 ? 100 : 0;
    };

    if (loading) {
        return (
            <div style={{ background: 'white', padding: '20px', borderRadius: '15px', textAlign: 'center' }}>
                <p>Chargement des statistiques...</p>
            </div>
        );
    }

    const variation = getVariation();
    const isPositive = variation >= 0;

    return (
        <div style={{ background: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px' }}>
            <h6 style={{ fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaUserPlus style={{ color: '#667eea' }} /> Nouveaux Patients - Statistiques
            </h6>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea' }}>
                        {stats.total.total || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Total patients</div>
                </div>
                
                <div style={{ textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745' }}>
                        {stats.total.ce_mois || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Nouveaux ce mois</div>
                    <div style={{ fontSize: '11px', color: isPositive ? '#28a745' : '#dc3545', marginTop: '5px' }}>
                        {isPositive ? '▲' : '▼'} {Math.abs(variation)}% vs mois dernier
                    </div>
                </div>
                
                <div style={{ textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                        {stats.top_mois[0]?.mois_nom?.substring(0, 10) || '-'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>Meilleur mois</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '5px' }}>
                        {stats.top_mois[0]?.total || 0} patients
                    </div>
                </div>
            </div>

            {/* Top 3 meilleurs mois */}
            <div style={{ marginTop: '15px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#6c757d' }}>
                    Meilleurs mois records
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {stats.top_mois.slice(0, 3).map((item, idx) => (
                        <div key={idx} style={{ flex: 1, textAlign: 'center', padding: '10px', background: idx === 0 ? '#fff3cd' : '#f8f9fa', borderRadius: '8px' }}>
                            <div style={{ fontSize: '24px' }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{item.mois_nom}</div>
                            <div style={{ fontSize: '14px', color: '#667eea', fontWeight: 'bold' }}>{item.total}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NewPatientsStats;