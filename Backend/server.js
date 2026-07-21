const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration CORS - Accepter tous les origins Render + localhost
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'https://cabinet-dentaire-frontend.onrender.com',
    process.env.FRONTEND_URL
].filter(Boolean);

console.log('✅ Origins CORS autorisés:', allowedOrigins);

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        if (origin.includes('.onrender.com')) {
            console.log('✅ Origin Render accepté:', origin);
            return callback(null, true);
        }
        console.error('❌ CORS bloqué pour origin:', origin);
        callback(new Error('Origin not allowed by CORS'));
    },
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

// ============ ROUTE D'ACCUEIL ============
app.get('/', (req, res) => {
    res.json({ message: 'Dentist API is running' });
});

// ============ ROUTES API ============
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/medicaments', require('./routes/medicaments'));
app.use('/api/paiement', require('./routes/paiementRoutes'));
app.use('/api/paiements', require('./routes/paiementRoutes'));

// ============ ROUTES DE TEST ET INITIALISATION ============

// Route pour tester la connexion à la base de données
app.get('/api/test-db', async (req, res) => {
    try {
        console.log('🔍 Test de connexion à la base de données...');
        
        // Vérifier la connexion
        const result = await pool.query('SELECT NOW() as time, current_database() as db');
        
        // Récupérer la liste des tables
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        // Compter les patients
        const patientCount = await pool.query('SELECT COUNT(*) as count FROM patients');
        
        res.json({
            success: true,
            time: result.rows[0].time,
            database: result.rows[0].db,
            tables: tables.rows.map(row => row.table_name),
            patient_count: parseInt(patientCount.rows[0].count)
        });
    } catch (error) {
        console.error('❌ Erreur test DB:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Route pour initialiser forcément la base de données
app.post('/api/init-db', async (req, res) => {
    try {
        console.log('🔧 Initialisation forcée de la base de données...');
        await initializeDatabase();
        res.json({ 
            success: true, 
            message: 'Base de données initialisée avec succès' 
        });
    } catch (error) {
        console.error('❌ Erreur init DB:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Route pour importer des patients de test (optionnel)
app.post('/api/import-test-patients', async (req, res) => {
    try {
        console.log('📥 Import de patients de test...');
        
        const testPatients = [
            { full_name: 'John Doe', phone: '12345678', address: 'Test Address 1', birth_date: '1990-01-01' },
            { full_name: 'Jane Smith', phone: '87654321', address: 'Test Address 2', birth_date: '1985-05-15' },
            { full_name: 'Bob Johnson', phone: '11223344', address: 'Test Address 3', birth_date: '1975-10-20' }
        ];
        
        let imported = 0;
        for (const patient of testPatients) {
            // Vérifier le numéro de fiche
            const maxFiche = await pool.query('SELECT COALESCE(MAX(numero_fiche), 0) as max FROM patients');
            const nextNumero = (maxFiche.rows[0].max || 0) + 1;
            
            await pool.query(
                `INSERT INTO patients (full_name, phone, address, birth_date, numero_fiche, paiement_status)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [patient.full_name, patient.phone, patient.address, patient.birth_date, nextNumero, 'non_paye']
            );
            imported++;
        }
        
        res.json({
            success: true,
            message: `${imported} patients de test importés avec succès`
        });
    } catch (error) {
        console.error('❌ Erreur import test:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ GESTIONNAIRE D'ERREURS ============
app.use((err, req, res, next) => {
    console.error('💥 Erreur serveur:', err.stack);
    res.status(500).json({ 
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============ INITIALISATION DE LA BASE DE DONNÉES ============
const initializeDatabase = async () => {
    try {
        console.log('📋 Vérification et création des tables...');
        
        // Table users
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                role VARCHAR(50) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table users créée/vérifiée');

        // Table patients
        await pool.query(`
            CREATE TABLE IF NOT EXISTS patients (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(20),
                address TEXT,
                birth_date DATE,
                age INTEGER,
                montant_total DECIMAL(10, 2) DEFAULT 0,
                montant_paye DECIMAL(10, 2) DEFAULT 0,
                montant_restant DECIMAL(10, 2) DEFAULT 0,
                paiement_status VARCHAR(50) DEFAULT 'non_paye',
                numero_fiche INTEGER,
                last_payment_update TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table patients créée/vérifiée');

        // Table appointments
        await pool.query(`
            CREATE TABLE IF NOT EXISTS appointments (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
                patient_name VARCHAR(255),
                appointment_date DATE,
                appointment_time VARCHAR(10),
                type VARCHAR(50) DEFAULT 'Consultation',
                status VARCHAR(50) DEFAULT 'scheduled',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table appointments créée/vérifiée');

        // Table consultations
        await pool.query(`
            CREATE TABLE IF NOT EXISTS consultations (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
                doctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                date_consultation DATE,
                diagnosis TEXT,
                observation TEXT,
                prescription TEXT,
                treatment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table consultations créée/vérifiée');

        // Table medicaments
        await pool.query(`
            CREATE TABLE IF NOT EXISTS medicaments (
                id SERIAL PRIMARY KEY,
                nom VARCHAR(255) NOT NULL,
                prix_unitaire DECIMAL(10, 2) DEFAULT 0,
                quantite_achetee INTEGER DEFAULT 0,
                quantite_disponible INTEGER DEFAULT 0,
                statut VARCHAR(50) DEFAULT 'disponible',
                description TEXT,
                fournisseur VARCHAR(255),
                date_expiration DATE,
                alerte_stock INTEGER DEFAULT 5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table medicaments créée/vérifiée');

        // Table stock_mouvements
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stock_mouvements (
                id SERIAL PRIMARY KEY,
                medicament_id INTEGER REFERENCES medicaments(id) ON DELETE CASCADE,
                type_mouvement VARCHAR(20),
                quantite INTEGER DEFAULT 0,
                raison TEXT,
                date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table stock_mouvements créée/vérifiée');

        // Table paiements
        await pool.query(`
            CREATE TABLE IF NOT EXISTS paiements (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
                montant_total DECIMAL(10, 2) DEFAULT 0,
                montant_paye DECIMAL(10, 2) DEFAULT 0,
                montant_restant DECIMAL(10, 2) DEFAULT 0,
                statut VARCHAR(50) DEFAULT 'non_paye',
                type_paiement VARCHAR(50) DEFAULT 'espece',
                cheque_info JSONB,
                notes TEXT,
                date_dernier_paiement TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table paiements créée/vérifiée');

        // Table paiement_historique
        await pool.query(`
            CREATE TABLE IF NOT EXISTS paiement_historique (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
                paiement_id INTEGER REFERENCES paiements(id) ON DELETE SET NULL,
                montant_total_avant DECIMAL(10,2) DEFAULT 0,
                montant_total_apres DECIMAL(10,2) DEFAULT 0,
                montant_paye_avant DECIMAL(10,2) DEFAULT 0,
                montant_paye_apres DECIMAL(10,2) DEFAULT 0,
                montant_restant_avant DECIMAL(10,2) DEFAULT 0,
                montant_restant_apres DECIMAL(10,2) DEFAULT 0,
                statut_avant VARCHAR(50),
                statut_apres VARCHAR(50),
                type_paiement_avant VARCHAR(50),
                type_paiement_apres VARCHAR(50),
                cheque_info_avant JSONB,
                cheque_info_apres JSONB,
                notes TEXT,
                user_action VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table paiement_historique créée/vérifiée');

        // Table alertes_paiement
        await pool.query(`
            CREATE TABLE IF NOT EXISTS alertes_paiement (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
                paiement_id INTEGER REFERENCES paiements(id) ON DELETE SET NULL,
                montant_restant DECIMAL(10,2),
                niveau_urgence VARCHAR(50) DEFAULT 'normal',
                status VARCHAR(50) DEFAULT 'active',
                date_alerte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_lecture TIMESTAMP,
                date_resolution TIMESTAMP
            )
        `);
        console.log('✓ Table alertes_paiement créée/vérifiée');

        // Table radiographies
        await pool.query(`
            CREATE TABLE IF NOT EXISTS radiographies (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
                consultation_id INTEGER REFERENCES consultations(id) ON DELETE SET NULL,
                image_url VARCHAR(255),
                description TEXT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table radiographies créée/vérifiée');

        // ============ CRÉATION DE L'UTILISATEUR ADMIN ============
        const result = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@dentiste.com']);
        if (result.rows.length === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                `INSERT INTO users (email, password, full_name, role) 
                 VALUES ($1, $2, $3, $4)`,
                ['admin@dentiste.com', hashedPassword, 'Administrateur', 'admin']
            );
            console.log('✓ Utilisateur admin créé (admin@dentiste.com / admin123)');
        } else {
            console.log('✓ Utilisateur admin existe déjà');
        }

        // Vérifier aussi l'autre compte si présent dans le frontend
        const result2 = await pool.query('SELECT id FROM users WHERE email = $1', ['dr.ayadineder@gmail.com']);
        if (result2.rows.length === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('ayadineder2024', 10);
            await pool.query(
                `INSERT INTO users (email, password, full_name, role) 
                 VALUES ($1, $2, $3, $4)`,
                ['dr.ayadineder@gmail.com', hashedPassword, 'Dr. Ayadi', 'admin']
            );
            console.log('✓ Utilisateur Dr. Ayadi créé (dr.ayadineder@gmail.com)');
        }

        console.log('✅ Base de données initialisée avec succès!');
        
        // Vérification finale : compter les tables
        const tableCheck = await pool.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log(`📊 ${tableCheck.rows[0].count} tables existent dans la base`);

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la base de données:', error.message);
        console.error('   Détails:', error.stack);
        throw error;
    }
};

// ============ DÉMARRAGE DU SERVEUR ============
app.listen(PORT, async () => {
    console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
    console.log(`🌐 Environnement: ${process.env.NODE_ENV || 'development'}`);
    
    try {
        await initializeDatabase();
        console.log('✅ Serveur prêt à recevoir des requêtes');
    } catch (error) {
        console.error('⚠️ Le serveur a démarré mais l\'initialisation DB a échoué');
        console.error('   Les routes API peuvent ne pas fonctionner correctement');
    }
});

module.exports = app;