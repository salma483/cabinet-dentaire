// backend/routes/patients.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database'); // ✅ AJOUTER CETTE LIGNE
const authenticateToken = require('../middleware/auth');

// Toutes les routes nécessitent authentification
router.use(authenticateToken);

// GET /api/patients - Récupérer tous les patients
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.*,
                TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) as age,
                COALESCE(SUM(CASE WHEN a.status = 'confirme' THEN 1 ELSE 0 END), 0) as total_appointments
            FROM patients p
            LEFT JOIN appointments a ON p.id = a.patient_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/patients/stats - Statistiques
router.get('/stats', async (req, res) => {
    try {
        console.log('📊 Récupération des statistiques patients...');
        
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_patients,
                SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) < 18 THEN 1 ELSE 0 END) as enfants,
                SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 18 AND 64 THEN 1 ELSE 0 END) as adultes,
                SUM(CASE WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) >= 65 THEN 1 ELSE 0 END) as seniors,
                SUM(CASE WHEN paiement_status = 'paye' THEN 1 ELSE 0 END) as paid,
                SUM(CASE WHEN paiement_status != 'paye' THEN 1 ELSE 0 END) as unpaid
            FROM patients
        `);
        
        const result = stats[0] || {
            total_patients: 0,
            enfants: 0,
            adultes: 0,
            seniors: 0,
            paid: 0,
            unpaid: 0
        };
        
        console.log('✅ Stats:', result);
        res.json(result);
    } catch (error) {
        console.error('❌ Erreur stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/patients - Ajouter un patient
router.post('/', async (req, res) => {
    try {
        const { full_name, birth_date, phone, address, paiement_status = 'non_paye' } = req.body;
        
        const [result] = await pool.query(
            'INSERT INTO patients (full_name, birth_date, phone, address, paiement_status) VALUES (?, ?, ?, ?, ?)',
            [full_name, birth_date, phone, address, paiement_status]
        );
        
        const [newPatient] = await pool.query('SELECT * FROM patients WHERE id = ?', [result.insertId]);
        res.status(201).json(newPatient[0]);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/patients/:id/payment - Mettre à jour le paiement
router.put('/:id/payment', async (req, res) => {
    try {
        const { id } = req.params;
        const { montant_paye, montant_total } = req.body;
        
        // Récupérer le patient
        const [patients] = await pool.query('SELECT * FROM patients WHERE id = ?', [id]);
        if (patients.length === 0) {
            return res.status(404).json({ error: 'Patient non trouvé' });
        }
        
        const patient = patients[0];
        const nouveauMontantPaye = montant_paye || 0;
        const montantTotal = montant_total || patient.montant_total || 0;
        
        let paiement_status = 'non_paye';
        if (nouveauMontantPaye >= montantTotal && montantTotal > 0) {
            paiement_status = 'paye';
        } else if (nouveauMontantPaye > 0 && nouveauMontantPaye < montantTotal) {
            paiement_status = 'semi_paye';
        }
        
        await pool.query(
            'UPDATE patients SET montant_paye = ?, paiement_status = ?, montant_total = ? WHERE id = ?',
            [nouveauMontantPaye, paiement_status, montantTotal, id]
        );
        
        const [updatedPatient] = await pool.query('SELECT * FROM patients WHERE id = ?', [id]);
        res.json({ patient: updatedPatient[0] });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/patients/:id - Supprimer un patient
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Supprimer d'abord les rendez-vous associés
        await pool.query('DELETE FROM appointments WHERE patient_id = ?', [id]);
        // Puis supprimer le patient
        await pool.query('DELETE FROM patients WHERE id = ?', [id]);
        
        res.json({ message: 'Patient supprimé' });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;