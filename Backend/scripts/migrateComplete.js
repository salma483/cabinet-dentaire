// Complete migration from MySQL to PostgreSQL
const mysql = require('mysql2/promise');
const pool = require('../config/database');
require('dotenv').config();

const migrateAllData = async () => {
  let mysqlPool;
  
  try {
    console.log('🔄 Création d\'un pool MySQL...');
    
    // Pool de connexions MySQL
    mysqlPool = await mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DB || 'dentist_dashboard',
      port: process.env.MYSQL_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });
    
    console.log('✅ Pool MySQL créé !');
    
    // ========== MIGRATION DES UTILISATEURS ==========
    console.log('\n📋 Migration des utilisateurs...');
    const [users] = await mysqlPool.query('SELECT * FROM users LIMIT 10000');
    let userCount = 0;
    
    for (const user of users) {
      try {
        await pool.query(
          `INSERT INTO users (id, email, password, full_name, role, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET email = $2, full_name = $4, role = $5`,
          [
            user.id,
            user.email,
            user.password,
            user.full_name || null,
            user.role || 'user',
            user.created_at || new Date()
          ]
        );
        userCount++;
      } catch (e) {
        console.error(`❌ Erreur user ${user.id}:`, e.message);
      }
    }
    console.log(`✓ ${userCount} utilisateurs importés`);
    
    // ========== MIGRATION DES PATIENTS ==========
    console.log('\n📋 Migration des patients...');
    const [patients] = await mysqlPool.query('SELECT * FROM patients LIMIT 10000');
    let patientCount = 0;
    
    // Importer par batches de 10
    for (let i = 0; i < patients.length; i += 10) {
      const batch = patients.slice(i, i + 10);
      
      for (const patient of batch) {
        try {
          const birthDate = patient.birth_date ? new Date(patient.birth_date).toISOString().split('T')[0] : null;
          
          await pool.query(
            `INSERT INTO patients 
              (id, full_name, email, phone, address, birth_date, age, montant_total, 
               montant_paye, montant_restant, paiement_status, numero_fiche, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO UPDATE SET 
               full_name = $2, email = $3, phone = $4, address = $5, birth_date = $6,
               age = $7, montant_total = $8, montant_paye = $9, montant_restant = $10`,
            [
              patient.id,
              patient.full_name,
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
              patient.created_at || new Date(),
              patient.updated_at || new Date()
            ]
          );
          
          patientCount++;
        } catch (e) {
          console.error(`❌ Erreur patient ${patient.id}:`, e.message);
        }
      }
      
      if (patientCount % 100 === 0 && patientCount > 0) {
        console.log(`   ✓ ${patientCount} patients importés...`);
      }
    }
    console.log(`✓ ${patientCount} patients importés`);
    
    // ========== MIGRATION DES RENDEZ-VOUS ==========
    console.log('\n📋 Migration des rendez-vous...');
    const [appointments] = await mysqlPool.query('SELECT * FROM appointments LIMIT 10000');
    let appointmentCount = 0;
    
    for (const apt of appointments) {
      try {
        await pool.query(
          `INSERT INTO appointments 
            (id, patient_id, doctor_id, appointment_date, description, status, notes, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET 
             appointment_date = $4, description = $5, status = $6, notes = $7`,
          [
            apt.id,
            apt.patient_id || null,
            apt.doctor_id || null,
            apt.appointment_date || null,
            apt.description || null,
            apt.status || 'scheduled',
            apt.notes || null,
            apt.created_at || new Date()
          ]
        );
        appointmentCount++;
      } catch (e) {
        console.error(`❌ Erreur appointment ${apt.id}:`, e.message);
      }
    }
    console.log(`✓ ${appointmentCount} rendez-vous importés`);
    
    // ========== MIGRATION DES CONSULTATIONS ==========
    console.log('\n📋 Migration des consultations...');
    const [consultations] = await mysqlPool.query('SELECT * FROM consultations LIMIT 10000');
    let consultationCount = 0;
    
    for (const cons of consultations) {
      try {
        const consultDate = cons.consultation_date || cons.date_consultation || null;
        
        await pool.query(
          `INSERT INTO consultations 
            (id, patient_id, doctor_id, date_consultation, description, diagnostic, treatment, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET 
             diagnostic = $6, treatment = $7`,
          [
            cons.id,
            cons.patient_id || null,
            cons.doctor_id || null,
            consultDate,
            cons.observation || cons.description || null,
            cons.diagnosis || cons.diagnostic || null,
            cons.treatment || null,
            cons.created_at || new Date()
          ]
        );
        consultationCount++;
      } catch (e) {
        console.error(`❌ Erreur consultation ${cons.id}:`, e.message);
      }
    }
    console.log(`✓ ${consultationCount} consultations importées`);
    
    // ========== MIGRATION DES MEDICAMENTS ==========
    console.log('\n📋 Migration des medicaments...');
    try {
      const [medicaments] = await mysqlPool.query('SELECT * FROM medicaments LIMIT 10000');
      let medicamentCount = 0;
      
      for (const med of medicaments) {
        try {
          await pool.query(
            `INSERT INTO medicaments 
              (id, nom, description, dosage, prix, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO UPDATE SET 
               nom = $2, description = $3, dosage = $4, prix = $5`,
            [
              med.id,
              med.nom,
              med.description || null,
              med.dosage || null,
              med.prix || 0,
              med.created_at || new Date()
            ]
          );
          medicamentCount++;
        } catch (e) {
          console.error(`❌ Erreur medicament ${med.id}:`, e.message);
        }
      }
      console.log(`✓ ${medicamentCount} medicaments importés`);
    } catch (e) {
      console.log(`⚠️ Table medicaments introuvable`);
    }
    
    // ========== MIGRATION DES PAIEMENTS ==========
    console.log('\n📋 Migration des paiements...');
    try {
      const [paiements] = await mysqlPool.query('SELECT * FROM paiements LIMIT 10000');
      let paiementCount = 0;
      
      for (const paie of paiements) {
        try {
          await pool.query(
            `INSERT INTO paiements 
              (id, patient_id, montant, mode_paiement, date_paiement, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET 
               montant = $3, status = $6`,
            [
              paie.id,
              paie.patient_id || null,
              paie.montant || 0,
              paie.mode_paiement || 'espece',
              paie.date_paiement || new Date(),
              paie.status || 'completed',
              paie.created_at || new Date()
            ]
          );
          paiementCount++;
        } catch (e) {
          console.error(`❌ Erreur paiement ${paie.id}:`, e.message);
        }
      }
      console.log(`✓ ${paiementCount} paiements importés`);
    } catch (e) {
      console.log(`⚠️ Table paiements introuvable`);
    }
    
    // ========== MIGRATION DES RADIOGRAPHIES ==========
    console.log('\n📋 Migration des radiographies...');
    try {
      const [radiographies] = await mysqlPool.query('SELECT * FROM radiographies LIMIT 10000');
      let radiographyCount = 0;
      
      for (const radio of radiographies) {
        try {
          await pool.query(
            `INSERT INTO radiographies 
              (id, patient_id, file_path, description, date_radiographie, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO UPDATE SET 
               description = $4`,
            [
              radio.id,
              radio.patient_id || null,
              radio.file_path || radio.chemin_fichier || null,
              radio.description || null,
              radio.date_radiographie || new Date(),
              radio.created_at || new Date()
            ]
          );
          radiographyCount++;
        } catch (e) {
          console.error(`❌ Erreur radiographie ${radio.id}:`, e.message);
        }
      }
      console.log(`✓ ${radiographyCount} radiographies importées`);
    } catch (e) {
      console.log(`⚠️ Table radiographies introuvable`);
    }
    
    console.log('\n✅ MIGRATION COMPLÈTE TERMINÉE !');
    console.log(`   ✓ ${userCount} utilisateurs`);
    console.log(`   ✓ ${patientCount} patients`);
    console.log(`   ✓ ${appointmentCount} rendez-vous`);
    console.log(`   ✓ ${consultationCount} consultations`);
    
    await mysqlPool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (mysqlPool) await mysqlPool.end();
    process.exit(1);
  }
};

migrateAllData();
