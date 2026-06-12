// src/components/dashboard/BI_NewPatients.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
    FaUserPlus, 
    FaChartLine, 
    FaCalendarAlt, 
    FaTrophy,
    FaChild,
    FaUser,
    FaUserGraduate,
    FaChartBar,
    FaDownload
} from 'react-icons/fa';

const BI_NewPatients = () => {
    const [loading, setLoading] = useState(true);
    const [periode, setPeriode] = useState('mois');
    const [stats, setStats] = useState({
        par_periode: [],
        total: { total: 0, ce_mois: 0, mois_dernier: 0 },
        quotidien: [],
        top_mois: []
    });
    const [evolution, setEvolution] = useState([]);

    const token = localStorage.getItem('token');
    const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        fetchData();
    }, [periode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsResponse, evolutionResponse] = await Promise.all([
                axios.get(`http://localhost:5000/api/patients/bi/new-patients?periode=${periode}`, axiosConfig),
                axios.get('http://localhost:5000/api/patients/bi/evolution', axiosConfig)
            ]);
            
            if (statsResponse.data.success) {
                setStats(statsResponse.data.data);
            }
            if (evolutionResponse.data.success) {
                setEvolution(evolutionResponse.data.data);
            }
        } catch (error) {
            console.error('Erreur chargement BI:', error);
            toast.error('Erreur de chargement des statistiques');
        } finally {
            setLoading(false);
        }
    };

    const exportData = () => {
        const dataToExport = stats.par_periode.map(item => ({
            Période: item.periode,
            'Nouveaux patients': item.nouveaux_patients,
            Enfants: item.enfants,
            Adultes: item.adultes,
            Seniors: item.seniors
        }));
        
        const csv = [Object.keys(dataToExport[0] || {}).join(','), 
                     ...dataToExport.map(row => Object.values(row).join(','))].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nouveaux_patients_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Export CSV réussi');
    };

    const getTendance = () => {
        if (stats.total.ce_mois > stats.total.mois_dernier) {
            return { text: 'En hausse', color: '#28a745', icon: '📈' };
        } else if (stats.total.ce_mois < stats.total.mois_dernier) {
            return { text: 'En baisse', color: '#dc3545', icon: '📉' };
        }
        return { text: 'Stable', color: '#ffc107', icon: '➡️' };
    };

    const tendance = getTendance();
    const variation = stats.total.mois_dernier > 0 
        ? ((stats.total.ce_mois - stats.total.mois_dernier) / stats.total.mois_dernier * 100).toFixed(1)
        : stats.total.ce_mois > 0 ? 100 : 0;

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <div className="spinner"></div>
                <p>Chargement des statistiques...</p>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaUserPlus /> Nouveaux Patients - Analyse BI
                </h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select 
                        value={periode} 
                        onChange={(e) => setPeriode(e.target.value)}
                        style={{
                            padding: '8px 15px',
                            borderRadius: '8px',
                            border: '1px solid #dee2e6',
                            background: 'white'
                        }}
                    >
                        <option value="mois">Par Mois</option>
                        <option value="semaine">Par Semaine</option>
                        <option value="annee">Par Année</option>
                    </select>
                    <button
                        onClick={exportData}
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
                </div>
            </div>

            {/* Cartes de synthèse */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', borderRadius: '15px', color: 'white' }}>
                    <FaUserPlus size={30} style={{ opacity: 0.8, marginBottom: '10px' }} />
                    <h2 style={{ margin: 0, fontSize: '32px' }}>{stats.total.total || 0}</h2>
                    <p style={{ margin: '5px 0 0', opacity: 0.9 }}>Total patients</p>
                </div>
                
                <div style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', padding: '20px', borderRadius: '15px', color: 'white' }}>
                    <FaCalendarAlt size={30} style={{ opacity: 0.8, marginBottom: '10px' }} />
                    <h2 style={{ margin: 0, fontSize: '32px' }}>{stats.total.ce_mois || 0}</h2>
                    <p style={{ margin: '5px 0 0', opacity: 0.9 }}>Nouveaux ce mois</p>
                </div>
                
                <div style={{ background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)', padding: '20px', borderRadius: '15px', color: 'white' }}>
                    <FaChartLine size={30} style={{ opacity: 0.8, marginBottom: '10px' }} />
                    <h2 style={{ margin: 0, fontSize: '32px' }}>{tendance.icon} {variation}%</h2>
                    <p style={{ margin: '5px 0 0', opacity: 0.9 }}>vs mois dernier ({tendance.text})</p>
                </div>
                
                <div style={{ background: 'linear-gradient(135deg, #fd7e14 0%, #e8590c 100%)', padding: '20px', borderRadius: '15px', color: 'white' }}>
                    <FaTrophy size={30} style={{ opacity: 0.8, marginBottom: '10px' }} />
                    <h2 style={{ margin: 0, fontSize: '28px' }}>{stats.top_mois[0]?.mois_nom || '-'}</h2>
                    <p style={{ margin: '5px 0 0', opacity: 0.9 }}>Record: {stats.top_mois[0]?.total || 0} patients</p>
                </div>
            </div>

            {/* Graphique d'évolution */}
            <div style={{ background: 'white', borderRadius: '15px', padding: '20px', marginBottom: '20px' }}>
                <h5 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaChartLine /> Évolution des nouveaux patients (12 derniers mois)
                </h5>
                <div style={{ overflowX: 'auto' }}>
                    <div style={{ minWidth: '600px' }}>
                        {evolution.length > 0 && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '10px' }}>
                                    {evolution.map((item, idx) => (
                                        <div key={idx} style={{ textAlign: 'center', fontSize: '12px', width: '60px' }}>
                                            {item.mois?.substring(5)}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '200px' }}>
                                    {evolution.map((item, idx) => {
                                        const maxValue = Math.max(...evolution.map(e => e.nouveaux_patients), 1);
                                        const height = (item.nouveaux_patients / maxValue) * 180;
                                        return (
                                            <div key={idx} style={{ textAlign: 'center', width: '60px' }}>
                                                <div style={{ 
                                                    height: `${height}px`, 
                                                    background: 'linear-gradient(180deg, #667eea, #764ba2)',
                                                    borderRadius: '5px 5px 0 0',
                                                    width: '40px',
                                                    margin: '0 auto',
                                                    position: 'relative',
                                                    transition: 'height 0.5s ease'
                                                }}>
                                                    <span style={{ 
                                                        position: 'absolute', 
                                                        top: '-25px', 
                                                        left: '50%', 
                                                        transform: 'translateX(-50%)',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {item.nouveaux_patients}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {/* Tableau par période */}
                <div style={{ background: 'white', borderRadius: '15px', padding: '20px' }}>
                    <h5 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaChartBar /> Répartition par {periode === 'mois' ? 'Mois' : periode === 'semaine' ? 'Semaine' : 'Année'}
                    </h5>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa' }}>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Période</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Nouveaux</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Enfants</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Adultes</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Seniors</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.par_periode.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>{item.periode}</td>
                                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{item.nouveaux_patients}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{item.enfants || 0}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{item.adultes || 0}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{item.seniors || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top mois et pyramide des âges */}
                <div style={{ background: 'white', borderRadius: '15px', padding: '20px' }}>
                    <h5 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaTrophy /> Meilleurs mois
                    </h5>
                    {stats.top_mois.map((item, idx) => (
                        <div key={idx} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '12px',
                            marginBottom: '10px',
                            background: idx === 0 ? '#fff3cd' : '#f8f9fa',
                            borderRadius: '10px'
                        }}>
                            <div>
                                <span style={{ fontSize: '20px', marginRight: '10px' }}>
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📅'}
                                </span>
                                <strong>{item.mois_nom}</strong>
                            </div>
                            <div>
                                <span style={{ 
                                    background: '#667eea', 
                                    color: 'white', 
                                    padding: '4px 12px', 
                                    borderRadius: '20px',
                                    fontWeight: 'bold'
                                }}>
                                    {item.total} nouveaux
                                </span>
                            </div>
                        </div>
                    ))}

                    <hr style={{ margin: '20px 0' }} />

                    <h5 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaChild /> Distribution par âge (tous patients)
                    </h5>
                    {stats.par_periode.length > 0 && (
                        <div>
                            <div style={{ marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span><FaChild color="#28a745" /> Enfants (&lt;18)</span>
                                    <span>{stats.par_periode.reduce((sum, p) => sum + (p.enfants || 0), 0)}</span>
                                </div>
                                <div style={{ background: '#e9ecef', borderRadius: '10px', height: '10px' }}>
                                    <div style={{ width: `${(stats.par_periode.reduce((sum, p) => sum + (p.enfants || 0), 0) / stats.total.total) * 100}%`, background: '#28a745', borderRadius: '10px', height: '10px' }} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span><FaUser color="#17a2b8" /> Adultes (18-64)</span>
                                    <span>{stats.par_periode.reduce((sum, p) => sum + (p.adultes || 0), 0)}</span>
                                </div>
                                <div style={{ background: '#e9ecef', borderRadius: '10px', height: '10px' }}>
                                    <div style={{ width: `${(stats.par_periode.reduce((sum, p) => sum + (p.adultes || 0), 0) / stats.total.total) * 100}%`, background: '#17a2b8', borderRadius: '10px', height: '10px' }} />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span><FaUserGraduate color="#fd7e14" /> Seniors (65+)</span>
                                    <span>{stats.par_periode.reduce((sum, p) => sum + (p.seniors || 0), 0)}</span>
                                </div>
                                <div style={{ background: '#e9ecef', borderRadius: '10px', height: '10px' }}>
                                    <div style={{ width: `${(stats.par_periode.reduce((sum, p) => sum + (p.seniors || 0), 0) / stats.total.total) * 100}%`, background: '#fd7e14', borderRadius: '10px', height: '10px' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Graphique quotidien récent */}
            <div style={{ background: 'white', borderRadius: '15px', padding: '20px', marginTop: '20px' }}>
                <h5 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaCalendarAlt /> Nouveaux patients - 30 derniers jours
                </h5>
                <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', gap: '5px', minWidth: '800px' }}>
                        {stats.quotidien.map((item, idx) => {
                            const maxValue = Math.max(...stats.quotidien.map(d => d.nouveaux_patients), 1);
                            const height = (item.nouveaux_patients / maxValue) * 100;
                            return (
                                <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{ 
                                        height: `${height}px`, 
                                        background: height > 0 ? '#28a745' : '#e9ecef',
                                        borderRadius: '5px 5px 0 0',
                                        width: '100%',
                                        cursor: 'pointer',
                                        transition: 'height 0.3s ease',
                                        position: 'relative'
                                    }}>
                                        {item.nouveaux_patients > 0 && (
                                            <span style={{ 
                                                position: 'absolute', 
                                                top: '-20px', 
                                                left: '50%', 
                                                transform: 'translateX(-50%)',
                                                fontSize: '10px'
                                            }}>
                                                {item.nouveaux_patients}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '10px', marginTop: '5px', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                                        {new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BI_NewPatients;