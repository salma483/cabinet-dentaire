const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const appointmentController = require('../controllers/appointmentController');

// Routes protégées par authentification
router.get('/', authenticateToken, appointmentController.getAllAppointments);
router.get('/today', authenticateToken, appointmentController.getTodayAppointments);
router.get('/:id', authenticateToken, appointmentController.getAppointmentById);
router.post('/', authenticateToken, appointmentController.addAppointment);
router.put('/:id', authenticateToken, appointmentController.updateAppointment);
router.delete('/:id', authenticateToken, appointmentController.deleteAppointment);

module.exports = router;