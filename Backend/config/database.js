// backend/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration de la connexion MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dentist_dashboard',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : false
});

// Tester la connexion sans faire planter le serveur
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Base de données connectée avec succès');
        console.log(`📁 Base: ${process.env.DB_NAME || 'dentist_dashboard'}`);
        connection.release();
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