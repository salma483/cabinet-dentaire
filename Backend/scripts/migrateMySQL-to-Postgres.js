// Import patients from MySQL to PostgreSQL
const mysql = require('mysql2/promise');
const pool = require('../config/database');
require('dotenv').config();

const importFromMySQL = async () => {
  let mysqlConnection;
  
  try {
    console.log('🔄 Connexion à MySQL...');
    
    // Connexion MySQL
    mysqlConnection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DB || 'dentist_dashboard',
      port: process.env.MYSQL_PORT || 3306
    });
    
    console.log('✅ Connecté à MySQL !');
    
    // Récupérer tous les patients de MySQL
    const [patients] = await mysqlConnection.query('SELECT * FROM patients');
    
    console.log(`📊 ${patients.length} patients trouvés dans MySQL`);
    console.log('📤 Importation dans PostgreSQL...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const patient of patients) {
      try {
        // Préparer les données
        const birthDate = patient.birth_date ? new Date(patient.birth_date).toISOString().split('T')[0] : null;
        
        // Insérer dans PostgreSQL
        await pool.query(
          `INSERT INTO patients 
            (full_name, email, phone, address, birth_date, age, montant_total, 
             montant_paye, montant_restant, paiement_status, numero_fiche, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO NOTHING`,
          [
            patient.full_name || null,
            patient.email || null,
            patient.phone || null,
            patient.address || null,
            birthDate,
            patient.age || null,
            patient.montant_total || 0,
            patient.montant_paye || 0,
            patient.montant_restant || 0,
            patient.paiement_status || 'non_paye',
            patient.numero_fiche || null,
            patient.created_at || new Date()
          ]
        );
        
        successCount++;
        if (successCount % 100 === 0) {
          console.log(`   ✓ ${successCount}/${patients.length} patients importés...`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur pour ${patient.full_name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Import terminé!`);
    console.log(`   ✓ ${successCount} patients importés avec succès`);
    if (errorCount > 0) {
      console.log(`   ⚠️ ${errorCount} erreurs`);
    }
    
    await mysqlConnection.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (mysqlConnection) await mysqlConnection.end();
    process.exit(1);
  }
};

importFromMySQL();
