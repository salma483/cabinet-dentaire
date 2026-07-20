const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const pool = require('./config/database');

app.use((req, res, next) => {
    req.db = pool;
    next();
});

app.get('/', (req, res) => {
    res.json({ message: 'Dentist API is running' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/medicaments', require('./routes/medicaments'));
app.use('/api/paiement', require('./routes/paiementRoutes'));
app.use('/api/paiements', require('./routes/paiementRoutes'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erreur interne du serveur' });
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
});

module.exports = app;