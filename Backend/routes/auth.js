// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');

// ============ ROUTES ============
router.post('/login', authController.login);
router.put('/profile', authenticateToken, authController.updateProfile);

module.exports = router;