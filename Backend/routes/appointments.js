// backend/routes/appointments.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const pool = require('../config/database');

// Routes protégées par authentification
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Vérifier si la table existe
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_name = 'appointments'
            )
        `);
        
        if (!tableCheck.rows[0].exists) {
            return res.json([]);
        }
        
        // Vérifier si la colonne appointment_time existe
        const columnCheck = await pool.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'appointments' 
                AND column_name = 'appointment_time'
            )
        `);
        
        const hasTimeColumn = columnCheck.rows[0].exists;
        
        let query;
        if (hasTimeColumn) {
            query = 'SELECT * FROM appointments ORDER BY appointment_date ASC, appointment_time ASC';
        } else {
            query = 'SELECT * FROM appointments ORDER BY appointment_date ASC';
        }
        
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur appointments:', error);
        // Renvoyer un tableau vide plutôt qu'une erreur
        res.json([]);
    }
});

router.get('/today', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM appointments WHERE DATE(appointment_date) = CURRENT_DATE ORDER BY appointment_date ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur today appointments:', error);
        res.json([]);
    }
});

// Les autres routes avec gestion d'erreur similaire
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur get appointment:', error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { patient_id, patient_name, appointment_date, type, notes } = req.body;
        
        if (!patient_name || !appointment_date) {
            return res.status(400).json({ 
                message: 'Le nom du patient et la date sont requis' 
            });
        }
        
        const result = await pool.query(
            `INSERT INTO appointments 
            (patient_id, patient_name, appointment_date, type, notes) 
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id`,
            [patient_id || null, patient_name, appointment_date, type || 'Consultation', notes || null]
        );
        
        res.status(201).json({ 
            message: 'Rendez-vous ajouté avec succès', 
            id: result.rows[0].id 
        });
    } catch (error) {
        console.error('Erreur add appointment:', error);
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { appointment_date, type, status, notes } = req.body;
        
        const result = await pool.query(
            `UPDATE appointments 
            SET appointment_date = $1, type = $2, status = $3, notes = $4 
            WHERE id = $5`,
            [appointment_date, type, status, notes, id]
        );
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }
        
        res.json({ message: 'Rendez-vous mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur update appointment:', error);
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query('DELETE FROM appointments WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }
        
        res.json({ message: 'Rendez-vous supprimé avec succès' });
    } catch (error) {
        console.error('Erreur delete appointment:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;