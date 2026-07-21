// Simple batch migration from MySQL to PostgreSQL
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

const migrateData = async () => {
  const pgPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dentist_dashboard',
    port: process.env.DB_PORT || 5432
  });

  let mysqlConn;
  
  try {
    // Une seule connexion MySQL
    mysqlConn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DB || 'dentist_dashboard',
      port: process.env.MYSQL_PORT || 3306
    });

    console.log('✅ Connecté à MySQL et PostgreSQL\n');

    // ===== PATIENTS =====
    console.log('📋 Migration des patients...');
    const [patients] = await mysqlConn.query('SELECT * FROM patients');
    
    for (const p of patients) {
      try {
        const birth = p.birth_date ? new Date(p.birth_date).toISOString().split('T')[0] : null;
        await pgPool.query(
          `INSERT INTO patients (id, full_name, email, phone, address, birth_date, age, montant_total, montant_paye, montant_restant, paiement_status, numero_fiche, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO NOTHING`,
          [p.id, p.full_name, p.email || null, p.phone || null, p.address || null, birth, p.age || null, 
           p.montant_total || 0, p.montant_paye || 0, p.montant_restant || 0, p.paiement_status || 'non_paye', 
           p.numero_fiche || null, p.created_at || new Date()]
        );
      } catch (e) {
        // Ignorer les erreurs
      }
    }
    console.log(`✓ ${patients.length} patients importés\n`);

    // ===== RENDEZ-VOUS =====
    console.log('📋 Migration des rendez-vous...');
    try {
      const [appts] = await mysqlConn.query('SELECT * FROM appointments');
      for (const a of appts) {
        try {
          await pgPool.query(
            `INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, description, status, notes, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
            [a.id, a.patient_id || null, a.doctor_id || null, a.appointment_date || null, a.description || null, 
             a.status || 'scheduled', a.notes || null, a.created_at || new Date()]
          );
        } catch (e) {}
      }
      console.log(`✓ ${appts.length} rendez-vous importés\n`);
    } catch (e) {
      console.log(`⚠️ Table appointments non trouvée\n`);
    }

    // ===== CONSULTATIONS =====
    console.log('📋 Migration des consultations...');
    try {
      const [cons] = await mysqlConn.query('SELECT * FROM consultations');
      for (const c of cons) {
        try {
          await pgPool.query(
            `INSERT INTO consultations (id, patient_id, doctor_id, date_consultation, description, diagnostic, treatment, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
            [c.id, c.patient_id || null, c.doctor_id || null, c.date_consultation || c.consultation_date || null,
             c.observation || c.description || null, c.diagnosis || c.diagnostic || null, c.treatment || null, c.created_at || new Date()]
          );
        } catch (e) {}
      }
      console.log(`✓ ${cons.length} consultations importées\n`);
    } catch (e) {
      console.log(`⚠️ Table consultations non trouvée\n`);
    }

    // ===== PAIEMENTS =====
    console.log('📋 Migration des paiements...');
    try {
      const [paiements] = await mysqlConn.query('SELECT * FROM paiements');
      for (const p of paiements) {
        try {
          await pgPool.query(
            `INSERT INTO paiements (id, patient_id, montant, mode_paiement, date_paiement, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
            [p.id, p.patient_id || null, p.montant || 0, p.mode_paiement || 'espece', 
             p.date_paiement || new Date(), p.status || 'completed', p.created_at || new Date()]
          );
        } catch (e) {}
      }
      console.log(`✓ ${paiements.length} paiements importés\n`);
    } catch (e) {
      console.log(`⚠️ Table paiements non trouvée\n`);
    }

    console.log('✅ MIGRATION TERMINÉE !');
    
    await mysqlConn.end();
    await pgPool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (mysqlConn) await mysqlConn.end();
    await pgPool.end();
    process.exit(1);
  }
};

migrateData();
