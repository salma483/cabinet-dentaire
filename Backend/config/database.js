// backend/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dentist_dashboard',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Tester la connexion
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Base de données connectée');
        connection.release();
    } catch (error) {
        console.error('❌ Erreur connexion DB:', error.message);
    }
})();

module.exports = pool;