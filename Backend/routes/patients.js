// routes/patients.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticateToken = require('../middleware/auth');
const pool = require('../config/database');

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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.use(authenticateToken);

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Route patients OK' });
});

// GET /api/patients - Récupérer tous les patients
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Récupération des patients...');
    const result = await pool.query(`
      SELECT
        p.id,
        p.full_name,
        p.address,
        p.phone,
        p.birth_date,
        COALESCE(date_part('year', age(p.birth_date)), 0)::int AS age,
        p.paiement_status,
        p.montant_total,
        p.montant_paye,
        p.montant_restant,
        p.numero_fiche,
        p.created_at,
        p.updated_at
      FROM patients p
      ORDER BY p.numero_fiche ASC
    `);
    console.log(`✅ ${result.rows.length} patients trouvés`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur get patients:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ✅ FONCTION DE VALIDATION DES DATES (utilisée dans POST et PUT)
// ============================================================
const validateAndCleanDate = (birth_date) => {
  if (!birth_date) return null;
  
  try {
    let cleanDate = String(birth_date).trim();
    
    // 🔥 Si c'est une chaîne vide
    if (!cleanDate || cleanDate === '') return null;
    
    // 🔥 Enlever les accents (é, è, à, etc.)
    cleanDate = cleanDate.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // 🔥 Garder uniquement chiffres, /, -
    cleanDate = cleanDate.replace(/[^0-9\-/]/g, '');
    
    // 🔥 Si après nettoyage c'est vide
    if (!cleanDate || cleanDate === '') return null;
    
    // 🔥 Essayer de parser la date
    const date = new Date(cleanDate);
    
    // 🔥 Vérifier que la date est valide
    if (isNaN(date.getTime())) return null;
    
    // 🔥 Vérifier que l'année est dans une plage valide (1900-2100)
    const year = date.getFullYear();
    if (year < 1900 || year > 2100) return null;
    
    // 🔥 Retourner la date au format YYYY-MM-DD
    return date.toISOString().split('T')[0];
    
  } catch (error) {
    console.error('❌ Erreur validation date:', error);
    return null;
  }
};

// ============================================================
// ✅ FONCTION DE CALCUL DE L'ÂGE
// ============================================================
const calculateAge = (birthDateStr) => {
  if (!birthDateStr) return null;
  
  try {
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch (error) {
    return null;
  }
};

// ============================================================
// POST /api/patients - Ajouter un patient (AVEC VALIDATION)
// ============================================================
router.post('/', async (req, res) => {
  try {
    const { full_name, birth_date, phone, address, paiement_status } = req.body;

    // ✅ Validation du nom
    if (!full_name || full_name.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Le nom complet est requis' 
      });
    }

    // ✅ Validation et nettoyage de la date
    const validatedBirthDate = validateAndCleanDate(birth_date);
    
    // ✅ Calcul de l'âge
    const age = calculateAge(validatedBirthDate);

    // ✅ Nettoyage du téléphone
    let cleanPhone = null;
    if (phone) {
      cleanPhone = String(phone).trim().substring(0, 20);
    }

    // ✅ Nettoyage de l'adresse
    let cleanAddress = null;
    if (address) {
      cleanAddress = String(address).trim().substring(0, 255);
    }

    // ✅ Récupération du prochain numéro de fiche
    const nextNumeroFicheResult = await pool.query(
      'SELECT COALESCE(MAX(numero_fiche), 0) AS max_fiche FROM patients'
    );
    const nextNumeroFiche = (nextNumeroFicheResult.rows[0]?.max_fiche || 0) + 1;

    // ✅ Insertion du patient
    const insertResult = await pool.query(
      `INSERT INTO patients
        (full_name, address, phone, birth_date, age, paiement_status, 
         montant_total, montant_paye, montant_restant, numero_fiche)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        full_name.trim().substring(0, 255),
        cleanAddress,
        cleanPhone,
        validatedBirthDate,
        age,
        paiement_status || 'non_paye',
        0,
        0,
        0,
        nextNumeroFiche
      ]
    );

    // ✅ Récupérer le patient créé
    const newPatientResult = await pool.query(
      'SELECT * FROM patients WHERE id = $1', 
      [insertResult.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: 'Patient ajouté avec succès',
      patient: newPatientResult.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur ajout patient:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============================================================
// PUT /api/patients/:id - Modifier un patient (AVEC VALIDATION)
// ============================================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, birth_date, phone, address } = req.body;

    // ✅ Vérifier si le patient existe
    const patientResult = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    if (patientResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Patient non trouvé' 
      });
    }

    // ✅ Validation du nom
    if (!full_name || full_name.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Le nom complet est requis' 
      });
    }

    // ✅ Validation et nettoyage de la date
    const validatedBirthDate = validateAndCleanDate(birth_date);
    
    // ✅ Calcul de l'âge
    const age = calculateAge(validatedBirthDate);

    // ✅ Nettoyage du téléphone
    let cleanPhone = null;
    if (phone) {
      cleanPhone = String(phone).trim().substring(0, 20);
    }

    // ✅ Nettoyage de l'adresse
    let cleanAddress = null;
    if (address) {
      cleanAddress = String(address).trim().substring(0, 255);
    }

    // ✅ Mise à jour du patient
    await pool.query(
      `UPDATE patients SET
        full_name = $1,
        birth_date = $2,
        age = $3,
        phone = $4,
        address = $5,
        updated_at = NOW()
       WHERE id = $6`,
      [
        full_name.trim().substring(0, 255),
        validatedBirthDate,
        age,
        cleanPhone,
        cleanAddress,
        id
      ]
    );

    // ✅ Récupérer le patient mis à jour
    const updatedResult = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    const updatedPatient = updatedResult.rows[0];

    res.json({
      success: true,
      message: 'Patient mis à jour avec succès',
      patient: updatedPatient
    });

  } catch (error) {
    console.error('❌ Erreur update patient:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============================================================
// DELETE /api/patients - Supprimer plusieurs patients
// ============================================================
router.delete('/', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Aucun ID fourni' 
      });
    }

    const validIds = ids.filter(id => !isNaN(parseInt(id))).map(id => parseInt(id));
    
    if (validIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'IDs invalides' 
      });
    }

    const placeholders = validIds.map((_, i) => `$${i + 1}`).join(', ');
    
    // ✅ Vérifier que les patients existent
    const patientsResult = await pool.query(
      `SELECT id FROM patients WHERE id IN (${placeholders})`,
      validIds
    );
    
    if (patientsResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Aucun patient trouvé' 
      });
    }

    // ✅ Supprimer les radiographies associées
    const radioResult = await pool.query(
      `SELECT image_url FROM radiographies WHERE patient_id IN (${placeholders})`,
      validIds
    );
    
    // ✅ Supprimer les fichiers physiques
    for (const radio of radioResult.rows) {
      if (radio.image_url) {
        const filePath = path.join(__dirname, '..', radio.image_url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    
    // ✅ Supprimer toutes les données associées
    await pool.query(
      `DELETE FROM radiographies WHERE patient_id IN (${placeholders})`,
      validIds
    );
    
    await pool.query(
      `DELETE FROM paiement_historique WHERE patient_id IN (${placeholders})`,
      validIds
    );
    
    await pool.query(
      `DELETE FROM appointments WHERE patient_id IN (${placeholders})`,
      validIds
    );
    
    await pool.query(
      `DELETE FROM consultations WHERE patient_id IN (${placeholders})`,
      validIds
    );
    
    await pool.query(
      `DELETE FROM paiements WHERE patient_id IN (${placeholders})`,
      validIds
    );
    
    // ✅ Supprimer les patients
    const result = await pool.query(
      `DELETE FROM patients WHERE id IN (${placeholders}) RETURNING id`,
      validIds
    );
    
    res.json({
      success: true,
      message: `${result.rows.length} patient${result.rows.length > 1 ? 's' : ''} supprimé${result.rows.length > 1 ? 's' : ''} avec succès`,
      deletedCount: result.rows.length,
      deletedIds: result.rows.map(row => row.id)
    });
    
  } catch (error) {
    console.error('❌ Erreur suppression multiple:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============================================================
// PUT /api/patients/:id/payment - Mettre à jour le paiement
// ============================================================
router.put('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { montant_total, montant_paye, notes, type_paiement, cheque_info } = req.body;

    const patientResult = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    const patient = patientResult.rows[0];
    if (!patient) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    const nouveauMontantTotal = montant_total !== undefined ? parseFloat(montant_total) : (parseFloat(patient.montant_total) || 0);
    const nouveauMontantPaye = montant_paye !== undefined ? parseFloat(montant_paye) : (parseFloat(patient.montant_paye) || 0);
    const montantReste = nouveauMontantTotal - nouveauMontantPaye;

    let paiement_status = 'non_paye';
    let notification = null;

    if (montantReste <= 0.01 && nouveauMontantTotal > 0) {
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
    } else if (nouveauMontantTotal > 0) {
      paiement_status = 'non_paye';
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

    const updatedResult = await pool.query(
      `UPDATE patients SET
        montant_total = $1,
        montant_paye = $2,
        montant_restant = $3,
        paiement_status = $4,
        last_payment_update = NOW()
       WHERE id = $5
       RETURNING id, full_name, montant_total, montant_paye, montant_restant, paiement_status, phone, address`,
      [
        nouveauMontantTotal,
        nouveauMontantPaye,
        Math.max(0, montantReste),
        paiement_status,
        id
      ]
    );

    res.json({
      success: true,
      message: 'Paiement mis à jour avec succès',
      patient: updatedResult.rows[0],
      notification
    });
  } catch (error) {
    console.error('❌ Erreur update payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/patients/:id/payment-history - Historique des paiements
// ============================================================
router.get('/:id/payment-history', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT ph.*, p.full_name AS patient_name, p.phone AS patient_phone, p.address AS patient_address
       FROM paiement_historique ph
       LEFT JOIN patients p ON ph.patient_id = p.id
       WHERE ph.patient_id = $1
       ORDER BY ph.created_at DESC`,
      [id]
    );

    const historique = result.rows.map(h => ({
      ...h,
      cheque_info_avant: h.cheque_info_avant ? (typeof h.cheque_info_avant === 'string' ? JSON.parse(h.cheque_info_avant) : h.cheque_info_avant) : null,
      cheque_info_apres: h.cheque_info_apres ? (typeof h.cheque_info_apres === 'string' ? JSON.parse(h.cheque_info_apres) : h.cheque_info_apres) : null
    }));

    res.json(historique);
  } catch (error) {
    console.error('❌ Erreur get historique:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/patients/stats - Statistiques
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) AS count FROM patients');
    const enfantsResult = await pool.query("SELECT COUNT(*) AS count FROM patients WHERE date_part('year', age(birth_date)) < 18");
    const adultesResult = await pool.query("SELECT COUNT(*) AS count FROM patients WHERE date_part('year', age(birth_date)) BETWEEN 18 AND 64");
    const seniorsResult = await pool.query("SELECT COUNT(*) AS count FROM patients WHERE date_part('year', age(birth_date)) >= 65");
    const paymentStats = await pool.query(`
      SELECT
        COALESCE(SUM(montant_total), 0) AS total_montant,
        COALESCE(SUM(montant_paye), 0) AS total_paye,
        COALESCE(SUM(montant_restant), 0) AS total_restant,
        COUNT(CASE WHEN paiement_status = 'paye' THEN 1 END) AS paye_count,
        COUNT(CASE WHEN paiement_status = 'semi_paye' THEN 1 END) AS semi_paye_count,
        COUNT(CASE WHEN paiement_status = 'non_paye' THEN 1 END) AS non_paye_count
      FROM patients
    `);

    res.json({
      total_patients: parseInt(totalResult.rows[0].count, 10) || 0,
      children: parseInt(enfantsResult.rows[0].count, 10) || 0,
      adults: parseInt(adultesResult.rows[0].count, 10) || 0,
      seniors: parseInt(seniorsResult.rows[0].count, 10) || 0,
      paid: parseInt(paymentStats.rows[0].paye_count, 10) || 0,
      semi_paid: parseInt(paymentStats.rows[0].semi_paye_count, 10) || 0,
      unpaid: parseInt(paymentStats.rows[0].non_paye_count, 10) || 0,
      total_montant: parseFloat(paymentStats.rows[0].total_montant) || 0,
      total_paye: parseFloat(paymentStats.rows[0].total_paye) || 0,
      total_restant: parseFloat(paymentStats.rows[0].total_restant) || 0
    });
  } catch (error) {
    console.error('❌ Erreur stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/patients/radiographies - Upload radiographie
// ============================================================
router.post('/radiographies', upload.single('image'), async (req, res) => {
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
    const insertResult = await pool.query(
      'INSERT INTO radiographies (patient_id, image_url, description) VALUES ($1, $2, $3) RETURNING id',
      [req.body.patient_id, image_url, req.body.description || '']
    );

    res.json({
      success: true,
      id: insertResult.rows[0].id,
      patient_id: req.body.patient_id,
      description: req.body.description || '',
      image_url,
      uploaded_at: new Date()
    });
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/patients/radiographies/:patientId - Récupérer les radiographies
// ============================================================
router.get('/radiographies/:patientId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM radiographies WHERE patient_id = $1 ORDER BY uploaded_at DESC', 
      [req.params.patientId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur radiographies:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// DELETE /api/patients/radiographies/:id - Supprimer une radiographie
// ============================================================
router.delete('/radiographies/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT image_url FROM radiographies WHERE id = $1', [req.params.id]);
    const rows = result.rows;

    if (rows.length > 0) {
      const filePath = path.join(__dirname, '..', rows[0].image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await pool.query('DELETE FROM radiographies WHERE id = $1', [req.params.id]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur supprimer radiographie:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// DELETE /api/patients/:id - Supprimer un patient
// ============================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ Supprimer l'historique des paiements
    await pool.query('DELETE FROM paiement_historique WHERE patient_id = $1', [id]);

    // ✅ Supprimer les radiographies et leurs fichiers
    const radiosResult = await pool.query('SELECT image_url FROM radiographies WHERE patient_id = $1', [id]);
    for (const radio of radiosResult.rows) {
      const filePath = path.join(__dirname, '..', radio.image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await pool.query('DELETE FROM radiographies WHERE patient_id = $1', [id]);

    // ✅ Supprimer les autres données associées
    await pool.query('DELETE FROM appointments WHERE patient_id = $1', [id]);
    await pool.query('DELETE FROM consultations WHERE patient_id = $1', [id]);
    await pool.query('DELETE FROM paiements WHERE patient_id = $1', [id]);

    // ✅ Supprimer le patient
    await pool.query('DELETE FROM patients WHERE id = $1', [id]);
    
    res.json({ 
      success: true,
      message: 'Patient supprimé avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur suppression patient:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;