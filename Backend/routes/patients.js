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

router.get('/', async (req, res) => {
  try {
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
        p.created_at
      FROM patients p
      ORDER BY p.numero_fiche ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur get patients:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { full_name, birth_date, phone, address, paiement_status } = req.body;

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

    const nextNumeroFicheResult = await pool.query('SELECT COALESCE(MAX(numero_fiche), 0) AS max_fiche FROM patients');
    const nextNumeroFiche = (nextNumeroFicheResult.rows[0]?.max_fiche || 0) + 1;

    const insertResult = await pool.query(
      `INSERT INTO patients
        (full_name, address, phone, birth_date, age, paiement_status, montant_total, montant_paye, montant_restant, numero_fiche)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        full_name.trim(),
        address || null,
        phone || null,
        birth_date || null,
        age,
        paiement_status || 'non_paye',
        0,
        0,
        0,
        nextNumeroFiche
      ]
    );

    res.status(201).json({
      id: insertResult.rows[0].id,
      numero_fiche: nextNumeroFiche,
      message: 'Patient ajouté avec succès'
    });
  } catch (error) {
    console.error('Erreur ajout patient:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { montant_total, montant_paye, notes } = req.body;

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
    console.error('Erreur update payment:', error);
    res.status(500).json({ error: error.message });
  }
});

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
    console.error('Erreur get historique:', error);
    res.status(500).json({ error: error.message });
  }
});

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
    console.error('Erreur stats:', error);
    res.status(500).json({ error: error.message });
  }
});

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
    console.error('Erreur upload:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

router.get('/radiographies/:patientId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM radiographies WHERE patient_id = $1 ORDER BY uploaded_at DESC', [req.params.patientId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur radiographies:', error);
    res.status(500).json({ error: error.message });
  }
});

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
    console.error('Erreur supprimer radiographie:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM paiement_historique WHERE patient_id = $1', [id]);

    const radiosResult = await pool.query('SELECT image_url FROM radiographies WHERE patient_id = $1', [id]);
    for (const radio of radiosResult.rows) {
      const filePath = path.join(__dirname, '..', radio.image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await pool.query('DELETE FROM radiographies WHERE patient_id = $1', [id]);

    await pool.query('DELETE FROM patients WHERE id = $1', [id]);
    res.json({ message: 'Patient supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression patient:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
