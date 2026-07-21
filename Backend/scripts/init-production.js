// backend/scripts/init-production.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
    try {
        console.log('🔧 Initialisation de la base de données PostgreSQL en production...');

        // Créer les tables
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

        await pool.query(`
            CREATE TABLE IF NOT EXISTS appointments (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
                doctor_id INTEGER REFERENCES users(id),
                appointment_date TIMESTAMP NOT NULL,
                description TEXT,
                status VARCHAR(50) DEFAULT 'scheduled',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table appointments créée/vérifiée');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS consultations (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id),
                doctor_id INTEGER REFERENCES users(id),
                date_consultation DATE NOT NULL,
                description TEXT,
                diagnostic TEXT,
                treatment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table consultations créée/vérifiée');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS medicaments (
                id SERIAL PRIMARY KEY,
                nom VARCHAR(255) NOT NULL,
                description TEXT,
                dosage VARCHAR(100),
                prix DECIMAL(10, 2),
                stock INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table medicaments créée/vérifiée');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS paiements (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id),
                montant DECIMAL(10, 2) NOT NULL,
                date_paiement DATE NOT NULL,
                methode_paiement VARCHAR(100),
                statut VARCHAR(50) DEFAULT 'completed',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table paiements créée/vérifiée');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS alertes (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id),
                titre VARCHAR(255),
                message TEXT,
                type VARCHAR(50),
                date_alerte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table alertes créée/vérifiée');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS paiement_historique (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
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

        await pool.query(`
            CREATE TABLE IF NOT EXISTS alertes_paiement (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
                paiement_id INTEGER REFERENCES paiements(id) ON DELETE SET NULL,
                montant_restant DECIMAL(10,2),
                niveau_urgence VARCHAR(50),
                status VARCHAR(50) DEFAULT 'active',
                date_alerte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_lecture TIMESTAMP,
                date_resolution TIMESTAMP
            )
        `);
        console.log('✓ Table alertes_paiement créée/vérifiée');

        // Vérifier si un utilisateur admin existe
        const result = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@dentiste.com']);
        if (result.rows.length === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                'INSERT INTO users (email, password, full_name, role) VALUES ($1, $2, $3, $4)',
                ['admin@dentiste.com', hashedPassword, 'Administrateur', 'admin']
            );
            console.log('✓ Utilisateur admin créé');
        } else {
            console.log('✓ Utilisateur admin existe déjà');
        }

        console.log('✅ Base de données initialisée avec succès!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

initDatabase();