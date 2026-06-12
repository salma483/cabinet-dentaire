// controllers/paiementController.js
const pool = require('../config/database');

class PaiementController {
    // Récupérer les paiements de tous les patients
    static async getAllPaiements(req, res) {
        try {
            const [paiements] = await pool.query(
                `SELECT 
                    p.id,
                    p.full_name,
                    p.birth_date,
                    p.phone,
                    p.address,
                    COALESCE(pai.montant_total, 0) as montant_total,
                    COALESCE(pai.montant_paye, 0) as montant_paye,
                    COALESCE(pai.montant_restant, 0) as montant_restant,
                    COALESCE(pai.statut, 'non_paye') as paiement_status,
                    COALESCE(pai.type_paiement, 'espece') as type_paiement,
                    pai.cheque_info,
                    pai.notes,
                    pai.date_dernier_paiement,
                    p.created_at
                FROM patients p
                LEFT JOIN paiements pai ON p.id = pai.patient_id
                ORDER BY p.created_at DESC`
            );
            
            const formattedPaiements = paiements.map(p => {
                let age = null;
                if (p.birth_date) {
                    const today = new Date();
                    const birthDate = new Date(p.birth_date);
                    age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }
                }
                
                let chequeInfo = null;
                if (p.cheque_info) {
                    try {
                        chequeInfo = typeof p.cheque_info === 'string' ? JSON.parse(p.cheque_info) : p.cheque_info;
                    } catch(e) {
                        chequeInfo = null;
                    }
                }
                
                return {
                    id: p.id,
                    full_name: p.full_name,
                    birth_date: p.birth_date,
                    created_at: p.created_at,
                    age: age,
                    phone: p.phone,
                    address: p.address,
                    montant_total: parseFloat(p.montant_total) || 0,
                    montant_paye: parseFloat(p.montant_paye) || 0,
                    montant_restant: parseFloat(p.montant_restant) || 0,
                    paiement_status: p.paiement_status || 'non_paye',
                    type_paiement: p.type_paiement || 'espece',
                    cheque_info: chequeInfo,
                    notes: p.notes,
                    date_dernier_paiement: p.date_dernier_paiement
                };
            });
            
            res.json(formattedPaiements);
        } catch (error) {
            console.error('Erreur getAllPaiements:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Mettre à jour un paiement
    static async updatePaiement(req, res) {
        console.log('=== UPDATE PAIEMENT ===');
        console.log('ID patient:', req.params.id);
        console.log('Body reçu:', req.body);
        
        try {
            const { id } = req.params;
            const { montant_total, montant_paye, notes, type_paiement, cheque_info } = req.body;
            
            const userId = req.user?.full_name || req.user?.username || 'Admin';
            
            const [patients] = await pool.query('SELECT * FROM patients WHERE id = ?', [id]);
            
            if (patients.length === 0) {
                return res.status(404).json({ error: 'Patient non trouvé' });
            }
            
            const patient = patients[0];
            const finalTypePaiement = type_paiement || 'espece';
            
            let [paiements] = await pool.query('SELECT * FROM paiements WHERE patient_id = ?', [id]);
            let paiementId;
            
            if (paiements.length === 0) {
                const [result] = await pool.query(
                    'INSERT INTO paiements (patient_id, montant_total, montant_paye, montant_restant, statut, type_paiement) VALUES (?, 0, 0, 0, "non_paye", ?)',
                    [id, finalTypePaiement]
                );
                paiementId = result.insertId;
                [paiements] = await pool.query('SELECT * FROM paiements WHERE id = ?', [paiementId]);
            }
            
            const paiement = paiements[0];
            const ancienMontantTotal = parseFloat(paiement.montant_total) || 0;
            const ancienMontantPaye = parseFloat(paiement.montant_paye) || 0;
            const ancienTypePaiement = paiement.type_paiement || 'espece';
            const ancienChequeInfo = paiement.cheque_info;
            
            const nouveauMontantTotal = montant_total !== undefined ? parseFloat(montant_total) : ancienMontantTotal;
            const nouveauMontantPaye = montant_paye !== undefined ? parseFloat(montant_paye) : ancienMontantPaye;
            const nouveauMontantRestant = nouveauMontantTotal - nouveauMontantPaye;
            const nouveauTypePaiement = finalTypePaiement;
            
            let nouveauChequeInfo = cheque_info ? JSON.stringify(cheque_info) : null;
            
            let nouveauStatut = 'non_paye';
            if (nouveauMontantTotal === 0) {
                nouveauStatut = 'non_paye';
            } else if (nouveauMontantRestant <= 0.01) {
                nouveauStatut = 'paye';
            } else if (nouveauMontantPaye > 0 && nouveauMontantRestant > 0.01) {
                nouveauStatut = 'semi_paye';
            }
            
            await pool.query(
                `UPDATE paiements SET 
                    montant_total = ?,
                    montant_paye = ?,
                    montant_restant = ?,
                    statut = ?,
                    type_paiement = ?,
                    cheque_info = ?,
                    date_dernier_paiement = CASE WHEN ? > 0 THEN NOW() ELSE date_dernier_paiement END,
                    notes = COALESCE(?, notes)
                WHERE patient_id = ?`,
                [
                    nouveauMontantTotal,
                    nouveauMontantPaye,
                    Math.max(0, nouveauMontantRestant),
                    nouveauStatut,
                    nouveauTypePaiement,
                    nouveauChequeInfo,
                    nouveauMontantPaye - ancienMontantPaye,
                    notes,
                    id
                ]
            );
            
            // Insertion dans l'historique des paiements
            await pool.query(
                `INSERT INTO paiement_historique 
                (patient_id, montant_total_avant, montant_total_apres, 
                 montant_paye_avant, montant_paye_apres, montant_restant_avant, 
                 montant_restant_apres, statut_avant, statut_apres, 
                 type_paiement_avant, type_paiement_apres, cheque_info_avant, cheque_info_apres,
                 notes, user_action, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    id,
                    ancienMontantTotal,
                    nouveauMontantTotal,
                    ancienMontantPaye,
                    nouveauMontantPaye,
                    ancienMontantTotal - ancienMontantPaye,
                    Math.max(0, nouveauMontantRestant),
                    paiement.statut,
                    nouveauStatut,
                    ancienTypePaiement,
                    nouveauTypePaiement,
                    ancienChequeInfo ? JSON.stringify(ancienChequeInfo) : null,
                    nouveauChequeInfo,
                    notes,
                    userId
                ]
            );
            
            let notification = null;
            let typeInfo = '';
            
            if (finalTypePaiement === 'espece') {
                typeInfo = '💰 Paiement en espèces';
            } else if (finalTypePaiement === 'cheque') {
                typeInfo = '📝 Paiement par chèque';
                if (cheque_info && cheque_info.numero) {
                    typeInfo += ` (N°: ${cheque_info.numero})`;
                }
            }
            
            if (nouveauStatut === 'paye') {
                notification = {
                    type: 'success',
                    title: '✅ Paiement complété',
                    message: `${patient.full_name} a complété son paiement.\n${typeInfo}\nTotal: ${nouveauMontantTotal.toFixed(2)} DT`
                };
            } else if (nouveauStatut === 'semi_paye') {
                notification = {
                    type: 'warning',
                    title: '⚠️ Paiement partiel',
                    message: `${patient.full_name} a un reste à payer de ${Math.max(0, nouveauMontantRestant).toFixed(2)} DT sur ${nouveauMontantTotal.toFixed(2)} DT\n${typeInfo}`,
                    patient_id: parseInt(id),
                    patient_name: patient.full_name,
                    phone: patient.phone,
                    address: patient.address
                };
            }
            
            res.json({
                success: true,
                message: 'Paiement mis à jour avec succès',
                patient: {
                    id: parseInt(id),
                    montant_total: nouveauMontantTotal,
                    montant_paye: nouveauMontantPaye,
                    montant_restant: Math.max(0, nouveauMontantRestant),
                    paiement_status: nouveauStatut,
                    type_paiement: nouveauTypePaiement,
                    cheque_info: cheque_info
                },
                notification: notification
            });
            
        } catch (error) {
            console.error('Erreur updatePaiement:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // Récupérer l'historique des paiements d'un patient spécifique
    static async getHistoriquePaiements(req, res) {
        console.log('=== GET HISTORIQUE ===');
        console.log('ID patient:', req.params.id);
        
        try {
            const { id } = req.params;
            const [historique] = await pool.query(
                `SELECT 
                    ph.*,
                    p.full_name as patient_name,
                    p.phone as patient_phone,
                    p.address as patient_address
                FROM paiement_historique ph
                LEFT JOIN patients p ON ph.patient_id = p.id
                WHERE ph.patient_id = ? 
                ORDER BY ph.created_at DESC`,
                [id]
            );
            
            // Formater les données JSON
            const formattedHistorique = historique.map(h => ({
                ...h,
                cheque_info_avant: h.cheque_info_avant ? 
                    (typeof h.cheque_info_avant === 'string' ? JSON.parse(h.cheque_info_avant) : h.cheque_info_avant) : null,
                cheque_info_apres: h.cheque_info_apres ? 
                    (typeof h.cheque_info_apres === 'string' ? JSON.parse(h.cheque_info_apres) : h.cheque_info_apres) : null
            }));
            
            res.json(formattedHistorique || []);
        } catch (error) {
            console.error('Erreur getHistoriquePaiements:', error);
            res.json([]);
        }
    }
    
    // Récupérer l'historique complet des paiements (tous patients)
    static async getAllHistoriquePaiements(req, res) {
        console.log('=== GET ALL HISTORIQUE PAIEMENTS ===');
        
        try {
            const [historique] = await pool.query(`
                SELECT 
                    ph.*,
                    p.full_name as patient_name,
                    p.phone as patient_phone,
                    p.address as patient_address
                FROM paiement_historique ph
                LEFT JOIN patients p ON ph.patient_id = p.id
                ORDER BY ph.created_at DESC
            `);
            
            // Formater correctement les données JSON
            const formattedHistorique = historique.map(h => {
                // Formater cheque_info_avant
                let chequeInfoAvant = null;
                if (h.cheque_info_avant) {
                    try {
                        chequeInfoAvant = typeof h.cheque_info_avant === 'string' 
                            ? JSON.parse(h.cheque_info_avant) 
                            : h.cheque_info_avant;
                    } catch(e) {
                        chequeInfoAvant = null;
                    }
                }
                
                // Formater cheque_info_apres
                let chequeInfoApres = null;
                if (h.cheque_info_apres) {
                    try {
                        chequeInfoApres = typeof h.cheque_info_apres === 'string' 
                            ? JSON.parse(h.cheque_info_apres) 
                            : h.cheque_info_apres;
                    } catch(e) {
                        chequeInfoApres = null;
                    }
                }
                
                return {
                    id: h.id,
                    patient_id: h.patient_id,
                    patient_name: h.patient_name,
                    patient_phone: h.patient_phone,
                    patient_address: h.patient_address,
                    montant_total_avant: parseFloat(h.montant_total_avant) || 0,
                    montant_total_apres: parseFloat(h.montant_total_apres) || 0,
                    montant_paye_avant: parseFloat(h.montant_paye_avant) || 0,
                    montant_paye_apres: parseFloat(h.montant_paye_apres) || 0,
                    montant_restant_avant: parseFloat(h.montant_restant_avant) || 0,
                    montant_restant_apres: parseFloat(h.montant_restant_apres) || 0,
                    statut_avant: h.statut_avant,
                    statut_apres: h.statut_apres,
                    type_paiement_avant: h.type_paiement_avant,
                    type_paiement_apres: h.type_paiement_apres,
                    cheque_info_avant: chequeInfoAvant,
                    cheque_info_apres: chequeInfoApres,
                    notes: h.notes,
                    user_action: h.user_action,
                    created_at: h.created_at
                };
            });
            
            res.json(formattedHistorique);
        } catch (error) {
            console.error('Erreur getAllHistoriquePaiements:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // Statistiques des paiements
    static async getStatsPaiements(req, res) {
        try {
            const [stats] = await pool.query(`
                SELECT 
                    COUNT(DISTINCT patient_id) as total_patients_avec_paiement,
                    COALESCE(SUM(montant_total), 0) as total_montant,
                    COALESCE(SUM(montant_paye), 0) as total_paye,
                    COALESCE(SUM(montant_restant), 0) as total_restant,
                    COUNT(CASE WHEN statut = 'paye' THEN 1 END) as paye_count,
                    COUNT(CASE WHEN statut = 'semi_paye' THEN 1 END) as semi_paye_count,
                    COUNT(CASE WHEN statut = 'non_paye' AND montant_total > 0 THEN 1 END) as non_paye_count
                FROM paiements
            `);
            res.json(stats[0] || {});
        } catch (error) {
            console.error('Erreur getStatsPaiements:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // ============ MÉTHODES POUR LES ALERTES ============
    
    // Récupérer toutes les alertes actives
    static async getAlertesActives(req, res) {
        try {
            // Vérifier si la table alertes_paiement existe
            const [tables] = await pool.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'alertes_paiement'
            `);
            
            if (tables[0].count === 0) {
                console.log('Table alertes_paiement n\'existe pas encore');
                return res.json([]);
            }
            
            const [alertes] = await pool.query(`
                SELECT 
                    a.*,
                    p.full_name as patient_name,
                    p.phone as patient_phone,
                    p.address as patient_address
                FROM alertes_paiement a
                JOIN patients p ON a.patient_id = p.id
                WHERE a.status = 'active'
                ORDER BY a.date_alerte DESC
            `);
            res.json(alertes || []);
        } catch (error) {
            console.error('Erreur getAlertesActives:', error);
            // Si la table n'existe pas, retourner un tableau vide
            res.json([]);
        }
    }
    
    // Marquer une alerte comme lue
    static async marquerAlerteLue(req, res) {
        try {
            const { id } = req.params;
            await pool.query(
                'UPDATE alertes_paiement SET status = "lue", date_lecture = NOW() WHERE id = ?',
                [id]
            );
            res.json({ success: true, message: 'Alerte marquée comme lue' });
        } catch (error) {
            console.error('Erreur marquerAlerteLue:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // Supprimer une alerte
    static async supprimerAlerte(req, res) {
        try {
            const { id } = req.params;
            await pool.query('UPDATE alertes_paiement SET status = "ignoree" WHERE id = ?', [id]);
            res.json({ success: true, message: 'Alerte supprimée' });
        } catch (error) {
            console.error('Erreur supprimerAlerte:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = PaiementController;