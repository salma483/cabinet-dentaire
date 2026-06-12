// routes/patients.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticateToken = require('../middleware/auth');
const patientController = require('../controllers/patientController');

// Configuration multer pour les images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/radiographies');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// ============ ROUTE DE TEST ============
// routes/patients.js - MODIFIER la route POST /

// ============ AJOUTER UN PATIENT (avec numero_fiche auto) ============
router.post('/', authenticateToken, async (req, res) => {
    console.log('=== AJOUT PATIENT - Route appelée ===');
    console.log('Données reçues:', req.body);
    
    try {
        const { full_name, birth_date, phone, address, paiement_status } = req.body;
        
        // Validation
        if (!full_name || full_name.trim() === '') {
            return res.status(400).json({ error: 'Le nom complet est requis' });
        }
        
        // Calculer le prochain numero_fiche
        const [maxResult] = await req.db.query(
            'SELECT COALESCE(MAX(numero_fiche), 0) as max_fiche FROM patients'
        );
        const nextNumeroFiche = (maxResult[0]?.max_fiche || 0) + 1;
        
        let age = null;
        if (birth_date) {
            const birth = new Date(birth_date);
            const today = new Date();
            age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        }
        
        // Insertion avec numero_fiche automatique
        const [result] = await req.db.query(
            `INSERT INTO patients 
            (full_name, address, phone, birth_date, age, paiement_status, 
             montant_total, montant_paye, montant_restant, numero_fiche) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [full_name.trim(), address || null, phone || null, birth_date || null, 
             age, paiement_status || 'non_paye', 0, 0, 0, nextNumeroFiche]
        );
        
        console.log(`Patient ajouté avec ID: ${result.insertId}, Numéro fiche: ${nextNumeroFiche}`);
        
        res.status(201).json({ 
            id: result.insertId,
            numero_fiche: nextNumeroFiche,
            message: 'Patient ajouté avec succès' 
        });
        
    } catch (error) {
        console.error('Erreur ajout patient:', error);
        res.status(500).json({ error: error.message });
    }
});
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Route patients OK' });
});

// ============ RÉCUPÉRER TOUS LES PATIENTS ============
// routes/patients.js - MODIFIER la route GET /
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [patients] = await req.db.query(
            `SELECT id, full_name, address, phone, birth_date, age, 
                    paiement_status, montant_total, montant_paye, montant_restant, 
                    numero_fiche, created_at 
             FROM patients 
             ORDER BY numero_fiche ASC`
        );
        res.json(patients);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ AJOUTER UN PATIENT (CORRIGÉ) ============
router.post('/', authenticateToken, async (req, res) => {
    console.log('=== AJOUT PATIENT - Route appelée ===');
    console.log('Données reçues:', req.body);
    
    try {
        const { full_name, birth_date, phone, address, paiement_status } = req.body;
        
        // Validation
        if (!full_name || full_name.trim() === '') {
            return res.status(400).json({ error: 'Le nom complet est requis' });
        }
        
        let age = null;
        if (birth_date) {
            const birth = new Date(birth_date);
            const today = new Date();
            age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        }
        
        // Insertion avec montants par défaut
        const [result] = await req.db.query(
            `INSERT INTO patients 
            (full_name, address, phone, birth_date, age, paiement_status, montant_total, montant_paye, montant_restant) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [full_name.trim(), address || null, phone || null, birth_date || null, age, paiement_status || 'non_paye', 0, 0, 0]
        );
        
        console.log('Patient ajouté avec ID:', result.insertId);
        
        res.status(201).json({ 
            id: result.insertId, 
            message: 'Patient ajouté avec succès' 
        });
        
    } catch (error) {
        console.error('Erreur ajout patient:', error);
        res.status(500).json({ error: error.message });
    }
});


// ============ ROUTE PAIEMENT (GESTION COMPLÈTE) ============
router.put('/:id/payment', authenticateToken, async (req, res) => {
    console.log('=== ROUTE PAYMENT APPELEE ===');
    console.log('ID:', req.params.id);
    console.log('Body:', req.body);
    
    try {
        const { id } = req.params;
        const { montant_total, montant_paye, notes } = req.body;
        
        // Récupérer le patient actuel
        const [patients] = await req.db.query('SELECT * FROM patients WHERE id = ?', [id]);
        
        if (patients.length === 0) {
            return res.status(404).json({ error: 'Patient non trouvé' });
        }
        
        const patient = patients[0];
        
        // Utiliser les nouvelles valeurs ou conserver les anciennes
        const nouveauMontantTotal = montant_total !== undefined ? parseFloat(montant_total) : (parseFloat(patient.montant_total) || 0);
        const nouveauMontantPaye = montant_paye !== undefined ? parseFloat(montant_paye) : (parseFloat(patient.montant_paye) || 0);
        
        // Calcul du montant restant
        const montantReste = nouveauMontantTotal - nouveauMontantPaye;
        
        // Déterminer le statut automatiquement
        let paiement_status = 'non_paye';
        let notification = null;
        
        if (montantReste <= 0.01) {
            paiement_status = 'paye';
            notification = {
                type: 'success',
                title: '✅ Paiement complété',
                message: `${patient.full_name} a complété son paiement. Total: ${nouveauMontantTotal.toFixed(2)} DT`
            };
        } else if (nouveauMontantPaye > 0 && montantReste > 0) {
            paiement_status = 'semi_paye';
            notification = {
                type: 'warning',
                title: '⚠️ Paiement partiel',
                message: `${patient.full_name} a un reste à payer de ${montantReste.toFixed(2)} DT sur ${nouveauMontantTotal.toFixed(2)} DT`,
                patient_id: parseInt(id),
                montant_restant: montantReste,
                patient_name: patient.full_name,
                phone: patient.phone,
                address: patient.address
            };
        } else {
            paiement_status = 'non_paye';
            if (nouveauMontantTotal > 0) {
                notification = {
                    type: 'alert',
                    title: '🔴 Paiement non effectué',
                    message: `${patient.full_name} n'a encore effectué aucun paiement sur un total de ${nouveauMontantTotal.toFixed(2)} DT.`,
                    patient_id: parseInt(id),
                    patient_name: patient.full_name,
                    phone: patient.phone,
                    address: patient.address
                };
            }
        }
        
        // Mettre à jour le patient
        await req.db.query(
            `UPDATE patients SET 
                montant_total = ?, 
                montant_paye = ?, 
                montant_restant = ?, 
                paiement_status = ?, 
                last_payment_update = NOW() 
            WHERE id = ?`,
            [nouveauMontantTotal, nouveauMontantPaye, Math.max(0, montantReste), paiement_status, id]
        );
        
        // Créer la table d'historique si elle n'existe pas
        try {
            await req.db.query(`
                CREATE TABLE IF NOT EXISTS paiement_historique (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    patient_id INT NOT NULL,
                    montant_total DECIMAL(10,2) DEFAULT 0,
                    montant_paye DECIMAL(10,2) DEFAULT 0,
                    montant_restant DECIMAL(10,2) DEFAULT 0,
                    status VARCHAR(50),
                    notes TEXT,
                    created_by VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
                )
            `);
            
            // Enregistrer dans l'historique
            await req.db.query(
                `INSERT INTO paiement_historique 
                    (patient_id, montant_total, montant_paye, montant_restant, status, notes, created_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, nouveauMontantTotal, nouveauMontantPaye, Math.max(0, montantReste), paiement_status, notes || null, req.user?.full_name || 'Admin']
            );
        } catch (historyError) {
            console.log('Erreur historique (non bloquante):', historyError.message);
        }
        
        // Retourner les données mises à jour
        const [updatedPatient] = await req.db.query(
            'SELECT id, full_name, montant_total, montant_paye, montant_restant, paiement_status, phone, address FROM patients WHERE id = ?',
            [id]
        );
        
        res.json({ 
            success: true,
            message: 'Paiement mis à jour avec succès',
            patient: updatedPatient[0],
            notification: notification
        });
        
    } catch (error) {
        console.error('Erreur update payment:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ HISTORIQUE DES PAIEMENTS ============
router.get('/:id/payment-history', authenticateToken, async (req, res) => {
    console.log('=== ROUTE HISTORY APPELEE ===');
    console.log('ID:', req.params.id);
    
    try {
        const { id } = req.params;
        
        // Vérifier si la table existe
        try {
            const [history] = await req.db.query(
                'SELECT * FROM paiement_historique WHERE patient_id = ? ORDER BY created_at DESC',
                [id]
            );
            res.json(history || []);
        } catch (tableError) {
            // Créer la table si elle n'existe pas
            await req.db.query(`
                CREATE TABLE IF NOT EXISTS paiement_historique (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    patient_id INT NOT NULL,
                    montant_total DECIMAL(10,2) DEFAULT 0,
                    montant_paye DECIMAL(10,2) DEFAULT 0,
                    montant_restant DECIMAL(10,2) DEFAULT 0,
                    status VARCHAR(50),
                    notes TEXT,
                    created_by VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
                )
            `);
            res.json([]);
        }
    } catch (error) {
        console.error('Erreur récupération historique:', error);
        res.json([]);
    }
});

// ============ STATISTIQUES ============
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const [total] = await req.db.query('SELECT COUNT(*) as count FROM patients');
        const [enfants] = await req.db.query("SELECT COUNT(*) as count FROM patients WHERE age < 18");
        const [adultes] = await req.db.query("SELECT COUNT(*) as count FROM patients WHERE age >= 18 AND age < 65");
        const [seniors] = await req.db.query("SELECT COUNT(*) as count FROM patients WHERE age >= 65");
        
        const [paymentStats] = await req.db.query(`
            SELECT 
                COALESCE(SUM(montant_total), 0) as total_montant,
                COALESCE(SUM(montant_paye), 0) as total_paye,
                COALESCE(SUM(montant_restant), 0) as total_restant,
                COUNT(CASE WHEN paiement_status = 'paye' THEN 1 END) as paye_count,
                COUNT(CASE WHEN paiement_status = 'semi_paye' THEN 1 END) as semi_paye_count,
                COUNT(CASE WHEN paiement_status = 'non_paye' THEN 1 END) as non_paye_count
            FROM patients
        `);
        
        res.json({
            total_patients: total[0].count,
            children: enfants[0].count,
            adults: adultes[0].count,
            seniors: seniors[0].count,
            paid: paymentStats[0].paye_count || 0,
            semi_paid: paymentStats[0].semi_paye_count || 0,
            unpaid: paymentStats[0].non_paye_count || 0,
            total_montant: parseFloat(paymentStats[0].total_montant) || 0,
            total_paye: parseFloat(paymentStats[0].total_paye) || 0,
            total_restant: parseFloat(paymentStats[0].total_restant) || 0
        });
    } catch (error) {
        console.error('Erreur stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ UPLOAD RADIOGRAPHIE ============
router.post('/radiographies', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucune image téléchargée' });
        }

        if (!req.body.patient_id) {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ error: 'ID patient manquant' });
        }

        const image_url = `/uploads/radiographies/${req.file.filename}`;
        const [result] = await req.db.query(
            'INSERT INTO radiographies (patient_id, image_url, description) VALUES (?, ?, ?)',
            [req.body.patient_id, image_url, req.body.description || '']
        );

        res.json({
            success: true,
            id: result.insertId,
            patient_id: req.body.patient_id,
            description: req.body.description || '',
            image_url: image_url,
            uploaded_at: new Date()
        });

    } catch (error) {
        console.error('Erreur upload:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
});

// ============ RÉCUPÉRER RADIOGRAPHIES ============
router.get('/radiographies/:patientId', authenticateToken, async (req, res) => {
    try {
        const [radiographies] = await req.db.query(
            'SELECT * FROM radiographies WHERE patient_id = ? ORDER BY uploaded_at DESC',
            [req.params.patientId]
        );
        res.json(radiographies);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ SUPPRIMER RADIOGRAPHIE ============
router.delete('/radiographies/:id', authenticateToken, async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT image_url FROM radiographies WHERE id = ?', [req.params.id]);
        
        if (rows.length > 0) {
            const filePath = path.join(__dirname, '..', rows[0].image_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            await req.db.query('DELETE FROM radiographies WHERE id = ?', [req.params.id]);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ SUPPRIMER PATIENT ============
router.delete('/:id', async (req, res) => {
    try {
        // Supprimer l'historique des paiements
        await req.db.query('DELETE FROM paiement_historique WHERE patient_id = ?', [req.params.id]);
        
        // Supprimer les radiographies
        const [radios] = await req.db.query('SELECT image_url FROM radiographies WHERE patient_id = ?', [req.params.id]);
        for (const radio of radios) {
            const filePath = path.join(__dirname, '..', radio.image_url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await req.db.query('DELETE FROM radiographies WHERE patient_id = ?', [req.params.id]);
        
        // Supprimer le patient
        await req.db.query('DELETE FROM patients WHERE id = ?', [req.params.id]);
        res.json({ message: 'Patient supprimé avec succès' });
    } catch (error) {
        console.error('Erreur suppression:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;