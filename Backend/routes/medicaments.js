// backend/routes/medicaments.js
const express = require('express');
const router = express.Router();
const medicamentController = require('../controllers/medicamentController');
const authenticateToken = require('../middleware/auth');

// Routes protégées
router.get('/', authenticateToken, medicamentController.getAllMedicaments);
router.get('/stats', authenticateToken, medicamentController.getStats);
router.get('/:id', authenticateToken, medicamentController.getMedicamentById);
router.get('/:id/mouvements', authenticateToken, medicamentController.getMouvements);
router.post('/', authenticateToken, medicamentController.addMedicament);
router.put('/:id', authenticateToken, medicamentController.updateMedicament);
router.put('/:id/stock', authenticateToken, medicamentController.updateStock);
router.delete('/:id', authenticateToken, medicamentController.deleteMedicament);

module.exports = router;