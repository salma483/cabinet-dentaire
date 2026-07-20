// backend/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la connexion PostgreSQL
// Priorité: DATABASE_URL (Render) > Variables d'env individuelles > Localhost
let pool;

if (process.env.DATABASE_URL) {
    // Si DATABASE_URL est définie (Render), l'utiliser directement
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false  // Render requiert SSL
        }
    });
    console.log('📡 Utilisation de DATABASE_URL pour PostgreSQL (Render)');
} else {
    // Sinon, utiliser les variables d'environnement individuelles (dev local)
    pool = new Pool({
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
    console.log('🏠 Utilisation des variables d\'env individuelles (Dev local)');
}

// Tester la connexion sans faire planter le serveur
(async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Base de données PostgreSQL connectée avec succès');
        const result = await client.query('SELECT current_database()');
        console.log(`📁 Base: ${result.rows[0].current_database}`);
        client.release();
    } catch (error) {
        console.error('⚠️ Base de données indisponible au démarrage:');
        console.error(`   ${error.message}`);
        console.error('\n💡 Vérifiez:');
        console.error('   1. DATABASE_URL est-elle correctement définie sur Render ?');
        console.error('   2. PostgreSQL est-il démarré (dev local) ?');
        console.error('   3. Les identifiants dans .env sont-ils corrects ?');
        console.error('   4. La base de données existe-t-elle ?');
    }
})();

module.exports = pool;