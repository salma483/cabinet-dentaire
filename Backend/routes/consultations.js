// routes/consultations.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const consultationController = require('../controllers/consultationController');

// Routes avec le controller
router.get('/', authenticateToken, consultationController.getAllConsultations);
router.get('/patient/:patientId', authenticateToken, consultationController.getConsultationsByPatient);
router.get('/:id', authenticateToken, consultationController.getConsultationById);
router.post('/', authenticateToken, consultationController.addConsultation);
router.put('/:id', authenticateToken, consultationController.updateConsultation);
router.delete('/:id', authenticateToken, consultationController.deleteConsultation);

module.exports = router;