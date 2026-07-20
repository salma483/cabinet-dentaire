// Backend/scripts/initDatabase.js
// Script pour initialiser la base de données PostgreSQL
// Usage: node scripts/initDatabase.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dentist_dashboard',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : false
});

async function initDatabase() {
    try {
        console.log('🔧 Initialisation de la base de données PostgreSQL...');
        
        // Lire le fichier SQL
        const sqlFile = path.join(__dirname, '../init.sql');
        const sql = fs.readFileSync(sqlFile, 'utf-8');
        
        // Exécuter le SQL
        const client = await pool.connect();
        await client.query(sql);
        console.log('✅ Base de données initialisée avec succès!');
        
        // Vérifier les tables créées
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log('\n📋 Tables créées:');
        result.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });
        
        client.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        process.exit(1);
    }
}

initDatabase();
