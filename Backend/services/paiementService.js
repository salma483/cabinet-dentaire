// services/paiementService.js
const pool = require('../config/database');

class PaiementService {
    static async getOrCreatePaiement(patientId) {
        try {
            let [paiements] = await pool.query(
                'SELECT * FROM paiements WHERE patient_id = ?',
                [patientId]
            );
            
            if (paiements.length === 0) {
                const [result] = await pool.query(
                    'INSERT INTO paiements (patient_id, montant_total, montant_paye, montant_restant, statut, type_paiement) VALUES (?, 0, 0, 0, "non_paye", "espece")',
                    [patientId]
                );
                const [newPaiement] = await pool.query(
                    'SELECT * FROM paiements WHERE id = ?',
                    [result.insertId]
                );
                return newPaiement[0];
            }
            
            return paiements[0];
        } catch (error) {
            console.error('Erreur getOrCreatePaiement:', error);
            throw error;
        }
    }
    
    static async updatePaiement(patientId, montantTotal, montantPaye, notes, userId, typePaiement = 'espece', chequeInfo = null) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            let [paiements] = await connection.query(
                'SELECT * FROM paiements WHERE patient_id = ? FOR UPDATE',
                [patientId]
            );
            
            let paiement;
            if (paiements.length === 0) {
                const [result] = await connection.query(
                    'INSERT INTO paiements (patient_id, montant_total, montant_paye, montant_restant, statut, notes, type_paiement, cheque_info) VALUES (?, 0, 0, 0, "non_paye", ?, ?, ?)',
                    [patientId, notes || null, typePaiement, chequeInfo ? JSON.stringify(chequeInfo) : null]
                );
                const [newPaiement] = await connection.query(
                    'SELECT * FROM paiements WHERE id = ?',
                    [result.insertId]
                );
                paiement = newPaiement[0];
            } else {
                paiement = paiements[0];
            }
            
            const ancienMontantTotal = parseFloat(paiement.montant_total) || 0;
            const ancienMontantPaye = parseFloat(paiement.montant_paye) || 0;
            const ancienTypePaiement = paiement.type_paiement || 'espece';
            const ancienChequeInfo = paiement.cheque_info;
            
            const nouveauMontantTotal = montantTotal !== undefined ? parseFloat(montantTotal) : ancienMontantTotal;
            const nouveauMontantPaye = montantPaye !== undefined ? parseFloat(montantPaye) : ancienMontantPaye;
            const nouveauMontantRestant = nouveauMontantTotal - nouveauMontantPaye;
            const nouveauTypePaiement = typePaiement || ancienTypePaiement;
            
            let nouveauChequeInfo = null;
            if (chequeInfo) {
                nouveauChequeInfo = JSON.stringify(chequeInfo);
            } else if (paiement.cheque_info && typePaiement === 'cheque') {
                nouveauChequeInfo = JSON.stringify(paiement.cheque_info);
            }
            
            let nouveauStatut = 'non_paye';
            if (nouveauMontantTotal === 0) {
                nouveauStatut = 'non_paye';
            } else if (nouveauMontantRestant <= 0.01) {
                nouveauStatut = 'paye';
            } else if (nouveauMontantPaye > 0 && nouveauMontantRestant > 0.01) {
                nouveauStatut = 'semi_paye';
            }
            
            await connection.query(
                `UPDATE paiements SET 
                    montant_total = ?,
                    montant_paye = ?,
                    montant_restant = ?,
                    statut = ?,
                    type_paiement = ?,
                    cheque_info = ?,
                    date_dernier_paiement = CASE 
                        WHEN ? > 0 THEN NOW() 
                        ELSE date_dernier_paiement 
                    END,
                    notes = COALESCE(?, notes)
                WHERE id = ?`,
                [
                    nouveauMontantTotal,
                    nouveauMontantPaye,
                    Math.max(0, nouveauMontantRestant),
                    nouveauStatut,
                    nouveauTypePaiement,
                    nouveauChequeInfo,
                    nouveauMontantPaye - ancienMontantPaye,
                    notes,
                    paiement.id
                ]
            );
            
            // ============ PARTIE CORRIGÉE ============
            // Insertion dans l'historique SANS paiement_id
            await connection.query(
                `INSERT INTO paiement_historique 
                (patient_id, montant_total_avant, montant_total_apres, 
                 montant_paye_avant, montant_paye_apres, montant_restant_avant, 
                 montant_restant_apres, statut_avant, statut_apres, 
                 type_paiement_avant, type_paiement_apres, cheque_info_avant, cheque_info_apres,
                 notes, user_action, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    patientId,
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
            // ========================================
            
            await this.creerAlerteSiNecessaire(connection, patientId, paiement.id, nouveauMontantTotal, nouveauMontantPaye, nouveauMontantRestant, nouveauStatut);
            
            await connection.commit();
            
            console.log(`✅ Paiement mis à jour: Patient=${patientId}, Type=${nouveauTypePaiement}, Statut=${nouveauStatut}`);
            
            return {
                id: paiement.id,
                patient_id: patientId,
                montant_total: nouveauMontantTotal,
                montant_paye: nouveauMontantPaye,
                montant_restant: Math.max(0, nouveauMontantRestant),
                statut: nouveauStatut,
                type_paiement: nouveauTypePaiement,
                cheque_info: nouveauChequeInfo ? JSON.parse(nouveauChequeInfo) : null
            };
            
        } catch (error) {
            await connection.rollback();
            console.error('Erreur updatePaiement:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
    
    static async getHistoriquePaiements(patientId) {
        try {
            const [historique] = await pool.query(
                `SELECT 
                    id,
                    montant_total_apres as montant_total,
                    montant_paye_apres as montant_paye,
                    montant_restant_apres as montant_restant,
                    statut_apres as statut,
                    type_paiement_apres as type_paiement,
                    cheque_info_apres as cheque_info,
                    notes,
                    user_action,
                    created_at
                FROM paiement_historique 
                WHERE patient_id = ?
                ORDER BY created_at DESC`,
                [patientId]
            );
            
            const formattedHistorique = historique.map(h => ({
                ...h,
                cheque_info: h.cheque_info ? JSON.parse(h.cheque_info) : null
            }));
            
            return formattedHistorique;
        } catch (error) {
            console.error('Erreur getHistoriquePaiements:', error);
            return [];
        }
    }
    
    static async creerAlerteSiNecessaire(connection, patientId, paiementId, montantTotal, montantPaye, montantRestant, statut) {
        try {
            const [alertesExistantes] = await connection.query(
                'SELECT id FROM alertes_paiement WHERE patient_id = ? AND status = "active"',
                [patientId]
            );
            
            if (statut !== 'paye' && montantRestant > 0.01) {
                let niveauUrgence = 'normal';
                if (montantRestant > 1000) niveauUrgence = 'critical';
                else if (montantRestant > 500) niveauUrgence = 'high';
                
                if (alertesExistantes.length === 0) {
                    await connection.query(
                        `INSERT INTO alertes_paiement 
                        (patient_id, paiement_id, montant_restant, niveau_urgence, status, date_alerte)
                        VALUES (?, ?, ?, ?, 'active', NOW())`,
                        [patientId, paiementId, montantRestant, niveauUrgence]
                    );
                } else {
                    await connection.query(
                        `UPDATE alertes_paiement 
                        SET montant_restant = ?, niveau_urgence = ?, date_alerte = NOW()
                        WHERE patient_id = ? AND status = 'active'`,
                        [montantRestant, niveauUrgence, patientId]
                    );
                }
            } else if (alertesExistantes.length > 0) {
                await connection.query(
                    `UPDATE alertes_paiement 
                    SET status = 'resolue', date_resolution = NOW()
                    WHERE patient_id = ? AND status = 'active'`,
                    [patientId]
                );
            }
        } catch (error) {
            console.error('Erreur creerAlerteSiNecessaire:', error);
        }
    }
    
    static async getAlertesActives() {
        try {
            const [alertes] = await pool.query(
                `SELECT 
                    a.*,
                    p.full_name as patient_name,
                    p.phone as patient_phone,
                    p.address as patient_address,
                    pai.montant_total,
                    pai.montant_paye,
                    pai.montant_restant
                FROM alertes_paiement a
                JOIN patients p ON a.patient_id = p.id
                JOIN paiements pai ON a.paiement_id = pai.id
                WHERE a.status = 'active'
                ORDER BY 
                    CASE a.niveau_urgence 
                        WHEN 'critical' THEN 1 
                        WHEN 'high' THEN 2 
                        ELSE 3 
                    END,
                    a.date_alerte DESC`,
                []
            );
            return alertes;
        } catch (error) {
            console.error('Erreur getAlertesActives:', error);
            return [];
        }
    }
    
    static async marquerAlerteLue(alerteId, userId) {
        try {
            await pool.query(
                `UPDATE alertes_paiement 
                SET status = 'lue', date_lecture = NOW() 
                WHERE id = ?`,
                [alerteId]
            );
            return true;
        } catch (error) {
            console.error('Erreur marquerAlerteLue:', error);
            return false;
        }
    }
    
    static async getStatsPaiements() {
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
            return stats[0];
        } catch (error) {
            console.error('Erreur getStatsPaiements:', error);
            return {};
        }
    }
}

module.exports = PaiementService;