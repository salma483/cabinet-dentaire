// backend/check-db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
    console.log('\n=========================================');
    console.log('🔍 VÉRIFICATION DE LA BASE DE DONNÉES');
    console.log('=========================================\n');

    // Configuration de connexion
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dentist_dashboard',
        port: process.env.DB_PORT || 3306
    };

    console.log('📋 Configuration utilisée:');
    console.log(`   Host: ${config.host}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   Port: ${config.port}\n`);

    let connection = null;
    
    try {
        // Connexion
        console.log('🔄 Tentative de connexion...');
        connection = await mysql.createConnection(config);
        console.log('✅ Connexion établie avec succès !\n');

        // 1. Vérifier la base de données
        console.log('📊 1. Vérification de la base:');
        const [dbCheck] = await connection.query('SELECT DATABASE() as current_db');
        console.log(`   Base actuelle: ${dbCheck[0].current_db}`);

        // 2. Compter les patients
        console.log('\n📊 2. Nombre total de patients:');
        const [countResult] = await connection.query('SELECT COUNT(*) as total FROM patients');
        console.log(`   Total: ${countResult[0].total} patient(s)`);

        // 3. Derniers patients ajoutés
        console.log('\n📋 3. Derniers patients ajoutés:');
        const [patients] = await connection.query(
            'SELECT id, full_name, phone, birth_date, created_at FROM patients ORDER BY id DESC LIMIT 5'
        );
        
        if (patients.length === 0) {
            console.log('   ⚠️ Aucun patient trouvé dans la base');
        } else {
            patients.forEach((p, index) => {
                console.log(`   ${index + 1}. ID: ${p.id}, Nom: ${p.full_name}`);
                console.log(`      Tél: ${p.phone || '-'}`);
                console.log(`      Créé le: ${p.created_at ? new Date(p.created_at).toLocaleString('fr-FR') : 'Non défini'}`);
            });
        }

        // 4. Vérifier auto-commit
        console.log('\n⚙️ 4. Configuration MySQL:');
        const [autocommit] = await connection.query('SELECT @@autocommit as autocommit');
        console.log(`   Auto-commit: ${autocommit[0].autocommit === 1 ? '✅ Activé' : '❌ Désactivé'}`);

        // 5. Vérifier l'utilisateur
        const [user] = await connection.query('SELECT USER() as current_user');
        console.log(`   Utilisateur MySQL: ${user[0].current_user}`);

        // 6. Vérifier la structure de la table patients
        console.log('\n📁 5. Structure de la table patients:');
        const [structure] = await connection.query('DESCRIBE patients');
        structure.forEach(col => {
            console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        // 7. Vérifier les index
        console.log('\n📊 6. Index de la table patients:');
        const [indexes] = await connection.query('SHOW INDEX FROM patients');
        const uniqueIndexes = new Set();
        indexes.forEach(idx => {
            if (idx.Key_name !== 'PRIMARY') {
                uniqueIndexes.add(idx.Key_name);
            }
        });
        if (uniqueIndexes.size > 0) {
            console.log(`   Index: ${Array.from(uniqueIndexes).join(', ')}`);
        } else {
            console.log('   Aucun index secondaire');
        }

        console.log('\n=========================================');
        console.log('✅ VÉRIFICATION TERMINÉE AVEC SUCCÈS');
        console.log('=========================================\n');

    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Problème d\'authentification:');
            console.error('   Vérifiez le mot de passe dans le fichier .env');
            console.error('   DB_PASSWORD=le_bon_mot_de_passe');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('\n💡 La base de données n\'existe pas:');
            console.error('   Exécutez d\'abord le script SQL pour créer la base');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 MySQL n\'est pas démarré:');
            console.error('   1. Ouvrez le Gestionnaire de services Windows');
            console.error('   2. Trouvez "MySQL"');
            console.error('   3. Démarrez le service');
        } else {
            console.error('\n💡 Autre erreur:', error.code || 'Inconnue');
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Connexion fermée');
        }
    }
}

// Exécuter la vérification
checkDatabase();