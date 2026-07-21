const pool = require('../config/database');

// Obtenir tous les rendez-vous
const getAllAppointments = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM appointments ORDER BY appointment_date ASC, appointment_time ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur getAllAppointments:', error);
        res.status(500).json({ message: error.message });
    }
};

// Obtenir les rendez-vous du jour
const getTodayAppointments = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM appointments WHERE DATE(appointment_date) = CURRENT_DATE ORDER BY appointment_time ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur getTodayAppointments:', error);
        res.status(500).json({ message: error.message });
    }
};

// Obtenir un rendez-vous par ID
const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM appointments WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur getAppointmentById:', error);
        res.status(500).json({ message: error.message });
    }
};

// Ajouter un rendez-vous
const addAppointment = async (req, res) => {
    try {
        const { patient_id, patient_name, appointment_date, appointment_time, type, notes } = req.body;
        
        console.log('📅 Nouveau rendez-vous reçu:', req.body);
        
        // Validation
        if (!patient_name || !appointment_date || !appointment_time) {
            return res.status(400).json({ 
                message: 'Le nom du patient, la date et l\'heure sont requis' 
            });
        }
        
        const result = await pool.query(
            `INSERT INTO appointments 
            (patient_id, patient_name, appointment_date, appointment_time, type, notes) 
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id`,
            [patient_id || null, patient_name, appointment_date, appointment_time, type || 'Consultation', notes || null]
        );
        
        res.status(201).json({ 
            message: 'Rendez-vous ajouté avec succès', 
            id: result.rows[0].id 
        });
    } catch (error) {
        console.error('Erreur addAppointment:', error);
        res.status(500).json({ message: error.message });
    }
};

// Modifier un rendez-vous
const updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { appointment_date, appointment_time, type, status, notes } = req.body;
        
        const result = await pool.query(
            `UPDATE appointments 
            SET appointment_date = $1, appointment_time = $2, type = $3, status = $4, notes = $5 
            WHERE id = $6`,
            [appointment_date, appointment_time, type, status, notes, id]
        );
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }
        
        res.json({ message: 'Rendez-vous mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur updateAppointment:', error);
        res.status(500).json({ message: error.message });
    }
};

// Supprimer un rendez-vous
const deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query('DELETE FROM appointments WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Rendez-vous non trouvé' });
        }
        
        res.json({ message: 'Rendez-vous supprimé avec succès' });
    } catch (error) {
        console.error('Erreur deleteAppointment:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllAppointments,
    getTodayAppointments,
    getAppointmentById,
    addAppointment,
    updateAppointment,
    deleteAppointment
};