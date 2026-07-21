// controllers/consultationController.js
const pool = require('../config/database');

// Récupérer toutes les consultations avec infos patient
const getAllConsultations = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, p.full_name as patient_name, p.phone, p.age, p.address
            FROM consultations c
            JOIN patients p ON c.patient_id = p.id
            ORDER BY c.date_consultation DESC, c.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur getAllConsultations:', error);
        res.status(500).json({ error: error.message });
    }
};

// Récupérer les consultations d'un patient spécifique
const getConsultationsByPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const result = await pool.query(`
            SELECT c.*, p.full_name as patient_name, p.phone, p.age
            FROM consultations c
            JOIN patients p ON c.patient_id = p.id
            WHERE c.patient_id = $1
            ORDER BY c.consultation_date DESC, c.created_at DESC
        `, [patientId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur getConsultationsByPatient:', error);
        res.status(500).json({ error: error.message });
    }
};

// Récupérer une consultation spécifique
const getConsultationById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT c.*, p.full_name as patient_name, p.phone, p.age, p.address
            FROM consultations c
            JOIN patients p ON c.patient_id = p.id
            WHERE c.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Consultation non trouvée' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur getConsultationById:', error);
        res.status(500).json({ error: error.message });
    }
};

// Ajouter une consultation
const addConsultation = async (req, res) => {
    try {
        const { patient_id, diagnosis, observation, prescription, treatment, consultation_date } = req.body;
        
        if (!patient_id) {
            return res.status(400).json({ error: 'ID patient requis' });
        }
        
        const consultationDate = consultation_date || new Date().toISOString().split('T')[0];
        
        const result = await pool.query(
            `INSERT INTO consultations (patient_id, diagnosis, observation, prescription, treatment, consultation_date) 
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [patient_id, diagnosis || null, observation || null, prescription || null, treatment || null, consultationDate]
        );
        
        const newConsultationResult = await pool.query(
            `SELECT c.*, p.full_name as patient_name 
             FROM consultations c 
             JOIN patients p ON c.patient_id = p.id 
             WHERE c.id = $1`,
            [result.rows[0].id]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Consultation enregistrée avec succès',
            consultation: newConsultationResult.rows[0]
        });
    } catch (error) {
        console.error('Erreur addConsultation:', error);
        res.status(500).json({ error: error.message });
    }
};

// Modifier une consultation
const updateConsultation = async (req, res) => {
    try {
        const { id } = req.params;
        const { diagnosis, observation, prescription, treatment, consultation_date } = req.body;
        
        await pool.query(
            `UPDATE consultations SET 
                diagnosis = $1, 
                observation = $2, 
                prescription = $3, 
                treatment = $4, 
                consultation_date = $5 
             WHERE id = $6`,
            [diagnosis || null, observation || null, prescription || null, treatment || null, consultation_date || null, id]
        );
        
        const updatedConsultationResult = await pool.query(
            `SELECT c.*, p.full_name as patient_name 
             FROM consultations c 
             JOIN patients p ON c.patient_id = p.id 
             WHERE c.id = $1`,
            [id]
        );
        
        res.json({ 
            success: true, 
            message: 'Consultation modifiée avec succès',
            consultation: updatedConsultationResult.rows[0]
        });
    } catch (error) {
        console.error('Erreur updateConsultation:', error);
        res.status(500).json({ error: error.message });
    }
};

// Supprimer une consultation
const deleteConsultation = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM consultations WHERE id = $1', [id]);
        res.json({ success: true, message: 'Consultation supprimée avec succès' });
    } catch (error) {
        console.error('Erreur deleteConsultation:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllConsultations,
    getConsultationsByPatient,
    getConsultationById,
    addConsultation,
    updateConsultation,
    deleteConsultation
};