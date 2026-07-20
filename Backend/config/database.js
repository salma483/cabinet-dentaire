// backend/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la connexion PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dentist_dashboard',
    port: process.env.DB_PORT || 5432,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : false
});

// Tester la connexion sans faire planter le serveur
(async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Base de données PostgreSQL connectée avec succès');
        console.log(`📁 Base: ${process.env.DB_NAME || 'dentist_dashboard'}`);
        client.release();
    } catch (error) {
        console.error('⚠️ Base de données indisponible au démarrage:');
        console.error(`   ${error.message}`);
        console.error('\n💡 Vérifiez:');
        console.error('   1. MySQL est-il démarré ?');
        console.error('   2. Les identifiants dans .env sont-ils corrects ?');
        console.error('   3. La base de données existe-t-elle ?');
        console.error('   4. Le port MySQL (3306) est-il libre ?');
    }
})();

module.exports = pool;