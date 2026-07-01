// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ CONNEXION À LA BASE DE DONNÉES - dentist_dashboard
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dentist_dashboard',  // ← CHANGÉ ICI
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware pour ajouter la DB à req
app.use((req, res, next) => {
    req.db = pool;
    next();
});

// Import des routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const medicamentRoutes = require('./routes/medicaments');
const appointmentRoutes = require('./routes/appointments');
const consultationRoutes = require('./routes/consultations');
const paiementRoutes = require('./routes/paiementRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medicaments', medicamentRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/paiements', paiementRoutes);

// Route de test
app.get('/api/test', (req, res) => {
    res.json({ message: 'API fonctionne parfaitement !' });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: 'Route non trouvée',
        requestedUrl: req.originalUrl 
    });
});

// Middleware global d'erreur
app.use((err, req, res, next) => {
    console.error('Erreur globale:', err);
    res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📁 Base de données: ${process.env.DB_NAME || 'dentist_dashboard'}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Le port ${PORT} est déjà utilisé. Fermez l'autre processus ou définissez un autre port dans PORT.`);
        process.exit(1);
    }
    console.error('Erreur serveur non gérée :', err);
    process.exit(1);
});