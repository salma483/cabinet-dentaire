// controllers/paiementController.js
const pool = require('../config/database');

class PaiementController {
    // Récupérer les paiements de tous les patients
    static async getAllPaiements(req, res) {
        try {
            const result = await pool.query(
                `SELECT 
                    p.id,
                    p.full_name,
                    p.birth_date,
                    p.phone,
                    p.address,
                    p.montant_total,
                    p.montant_paye,
                    p.montant_restant,
                    p.paiement_status,
                    p.created_at
                FROM patients p
                ORDER BY p.created_at DESC`
            );
            
            const formattedPaiements = result.rows.map(p => {
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
                    paiement_status: p.paiement_status || 'non_paye'
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
            const { montant_total, montant_paye, notes } = req.body;
            
            const userId = req.user?.full_name || req.user?.username || 'Admin';
            
            const patientsResult = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
            
            if (patientsResult.rows.length === 0) {
                return res.status(404).json({ error: 'Patient non trouvé' });
            }
            
            const patient = patientsResult.rows[0];
            
            const ancienMontantTotal = parseFloat(patient.montant_total) || 0;
            const ancienMontantPaye = parseFloat(patient.montant_paye) || 0;
            
            const nouveauMontantTotal = montant_total !== undefined ? parseFloat(montant_total) : ancienMontantTotal;
            const nouveauMontantPaye = montant_paye !== undefined ? parseFloat(montant_paye) : ancienMontantPaye;
            const nouveauMontantRestant = nouveauMontantTotal - nouveauMontantPaye;
            
            let nouveauStatut = 'non_paye';
            if (nouveauMontantTotal === 0) {
                nouveauStatut = 'non_paye';
            } else if (nouveauMontantRestant <= 0.01) {
                nouveauStatut = 'paye';
            } else if (nouveauMontantPaye > 0 && nouveauMontantRestant > 0.01) {
                nouveauStatut = 'semi_paye';
            }
            
            await pool.query(
                `UPDATE patients SET 
                    montant_total = $1,
                    montant_paye = $2,
                    montant_restant = $3,
                    paiement_status = $4,
                    updated_at = NOW()
                WHERE id = $5`,
                [
                    nouveauMontantTotal,
                    nouveauMontantPaye,
                    Math.max(0, nouveauMontantRestant),
                    nouveauStatut,
                    id
                ]
            );
            
            // Insertion dans l'historique des paiements
            await pool.query(
                `INSERT INTO paiement_historique 
                (patient_id, montant_total_avant, montant_total_apres, 
                 montant_paye_avant, montant_paye_apres, montant_restant_avant, 
                 montant_restant_apres, statut_avant, statut_apres, notes, user_action)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                    id,
                    ancienMontantTotal,
                    nouveauMontantTotal,
                    ancienMontantPaye,
                    nouveauMontantPaye,
                    ancienMontantTotal - ancienMontantPaye,
                    Math.max(0, nouveauMontantRestant),
                    patient.paiement_status,
                    nouveauStatut,
                    notes,
                    userId
                ]
            );
            
            // Récupérer le patient mis à jour
            const updatedResult = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
            const updated = updatedResult.rows[0];
            
            res.json({
                success: true,
                message: 'Paiement mis à jour avec succès',
                patient: {
                    id: updated.id,
                    full_name: updated.full_name,
                    montant_total: parseFloat(updated.montant_total),
                    montant_paye: parseFloat(updated.montant_paye),
                    montant_restant: parseFloat(updated.montant_restant),
                    paiement_status: updated.paiement_status
                }
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
            const historiqueResult = await pool.query(
                `SELECT *
                FROM paiement_historique
                WHERE patient_id = $1 
                ORDER BY created_at DESC`,
                [id]
            );
            const historique = historiqueResult.rows;
            
            res.json(historique || []);
        } catch (error) {
            console.error('Erreur getHistoriquePaiements:', error);
            res.json([]);
        }
    }
    
    // Récupérer l'historique complet des paiements (tous patients)
    static async getAllHistoriquePaiements(req, res) {
        console.log('=== GET ALL HISTORIQUE PAIEMENTS ===');
        
        try {
            const historiqueResult = await pool.query(`
                SELECT *
                FROM paiement_historique
                ORDER BY created_at DESC
            `);
            const historique = historiqueResult.rows;
            
            res.json(historique);
        } catch (error) {
            console.error('Erreur getAllHistoriquePaiements:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // Statistiques des paiements
    static async getStatsPaiements(req, res) {
        try {
            const result = await pool.query(`
                SELECT 
                    COUNT(*) as total_patients_avec_paiement,
                    COALESCE(SUM(montant_total), 0) as total_montant,
                    COALESCE(SUM(montant_paye), 0) as total_paye,
                    COALESCE(SUM(montant_restant), 0) as total_restant,
                    COUNT(CASE WHEN paiement_status = 'paye' THEN 1 END) as paye_count,
                    COUNT(CASE WHEN paiement_status = 'semi_paye' THEN 1 END) as semi_paye_count,
                    COUNT(CASE WHEN paiement_status = 'non_paye' AND montant_total > 0 THEN 1 END) as non_paye_count
                FROM patients
            `);
            res.json(result.rows[0] || {});
        } catch (error) {
            console.error('Erreur getStatsPaiements:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // Récupérer toutes les alertes actives
    static async getAlertesActives(req, res) {
        try {
            const result = await pool.query(`
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
            res.json(result.rows || []);
        } catch (error) {
            console.error('Erreur getAlertesActives:', error);
            res.json([]);
        }
    }
    
    // Marquer une alerte comme lue
    static async marquerAlerteLue(req, res) {
        try {
            const { id } = req.params;
            await pool.query(
                'UPDATE alertes_paiement SET status = $1, date_lecture = NOW() WHERE id = $2',
                ['lue', id]
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
            await pool.query('UPDATE alertes_paiement SET status = $1 WHERE id = $2', ['ignoree', id]);
            res.json({ success: true, message: 'Alerte supprimée' });
        } catch (error) {
            console.error('Erreur supprimerAlerte:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = PaiementController;