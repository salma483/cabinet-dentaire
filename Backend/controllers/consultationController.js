// controllers/consultationController.js
const pool = require('../config/database');

// Récupérer toutes les consultations avec infos patient
const getAllConsultations = async (req, res) => {
    try {
        const [consultations] = await pool.query(`
            SELECT c.*, p.full_name as patient_name, p.phone, p.age, p.address
            FROM consultations c
            JOIN patients p ON c.patient_id = p.id
            ORDER BY c.consultation_date DESC, c.created_at DESC
        `);
        res.json(consultations);
    } catch (error) {
        console.error('Erreur getAllConsultations:', error);
        res.status(500).json({ error: error.message });
    }
};

// Récupérer les consultations d'un patient spécifique
const getConsultationsByPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const [consultations] = await pool.query(`
            SELECT c.*, p.full_name as patient_name, p.phone, p.age
            FROM consultations c
            JOIN patients p ON c.patient_id = p.id
            WHERE c.patient_id = ?
            ORDER BY c.consultation_date DESC, c.created_at DESC
        `, [patientId]);
        res.json(consultations);
    } catch (error) {
        console.error('Erreur getConsultationsByPatient:', error);
        res.status(500).json({ error: error.message });
    }
};

// Récupérer une consultation spécifique
const getConsultationById = async (req, res) => {
    try {
        const { id } = req.params;
        const [consultations] = await pool.query(`
            SELECT c.*, p.full_name as patient_name, p.phone, p.age, p.address
            FROM consultations c
            JOIN patients p ON c.patient_id = p.id
            WHERE c.id = ?
        `, [id]);
        
        if (consultations.length === 0) {
            return res.status(404).json({ error: 'Consultation non trouvée' });
        }
        res.json(consultations[0]);
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
        
        const [result] = await pool.query(
            `INSERT INTO consultations (patient_id, diagnosis, observation, prescription, treatment, consultation_date) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [patient_id, diagnosis || null, observation || null, prescription || null, treatment || null, consultationDate]
        );
        
        const [newConsultation] = await pool.query(
            `SELECT c.*, p.full_name as patient_name 
             FROM consultations c 
             JOIN patients p ON c.patient_id = p.id 
             WHERE c.id = ?`,
            [result.insertId]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Consultation enregistrée avec succès',
            consultation: newConsultation[0]
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
                diagnosis = ?, 
                observation = ?, 
                prescription = ?, 
                treatment = ?, 
                consultation_date = ? 
             WHERE id = ?`,
            [diagnosis || null, observation || null, prescription || null, treatment || null, consultation_date || null, id]
        );
        
        const [updatedConsultation] = await pool.query(
            `SELECT c.*, p.full_name as patient_name 
             FROM consultations c 
             JOIN patients p ON c.patient_id = p.id 
             WHERE c.id = ?`,
            [id]
        );
        
        res.json({ 
            success: true, 
            message: 'Consultation modifiée avec succès',
            consultation: updatedConsultation[0]
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
        await pool.query('DELETE FROM consultations WHERE id = ?', [id]);
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