// routes/paiementRoutes.js
const express = require('express');
const router = express.Router();
const PaiementController = require('../controllers/paiementController');
const authMiddleware = require('../middleware/auth');

// Toutes les routes nécessitent authentification
router.use(authMiddleware);

// Routes principales des paiements
router.get('/', PaiementController.getAllPaiements);
router.put('/:id/payment', PaiementController.updatePaiement);
router.get('/:id/payment-history', PaiementController.getHistoriquePaiements);
router.get('/stats', PaiementController.getStatsPaiements);

// Route pour l'historique complet (tous patients)
router.get('/historique-complet', PaiementController.getAllHistoriquePaiements);

// Routes des alertes
router.get('/alertes', PaiementController.getAlertesActives);
router.put('/alertes/:id/lire', PaiementController.marquerAlerteLue);
router.delete('/alertes/:id', PaiementController.supprimerAlerte);

module.exports = router;