// Import patients into PostgreSQL from the data array
const pool = require('../config/database');
require('dotenv').config();

const patientsData = [
  { full_name: "ouni ichrak", address: "H.riadh sousse", phone: "27.815.680", birth_date: "1999-12-07" },
  { full_name: "smida najib", address: "cite riadh", phone: "98.607.369", birth_date: "1959-01-25" },
  { full_name: "debbich kamel", address: "cite riadh", phone: "53.890.676", birth_date: "1979-04-14" },
  { full_name: "tabouii najib", address: "cite riadh", phone: "27.787.397", birth_date: "1994-03-26" },
  { full_name: "smida wissem", address: "cite riadh", phone: "98.607.369", birth_date: "1990-07-03" },
  { full_name: "abdel mlak mouhamed", address: "cite riadh", phone: "97.407.433", birth_date: "1977-05-23" },
  { full_name: "hajii fatma", address: "cite riadh", phone: "92.309.909", birth_date: "1969-03-29" },
  { full_name: "zaghden med anass", address: "cite riadh", phone: "58.131.205", birth_date: "2013-08-21" },
  { full_name: "ateya mounira", address: "cite riadh", phone: "94.830.027", birth_date: "1963-05-20" },
  { full_name: "selmi chaima", address: "cite riadh", phone: "50.835.144", birth_date: "1995-05-20" },
  { full_name: "timoumi mouna", address: "cite riadh", phone: "92.115.084", birth_date: "1980-02-15" },
  { full_name: "souilem mouhamed", address: "cite riadh", phone: "21.879.648", birth_date: "1987-08-07" },
  { full_name: "hajii iadh", address: "cite riadh", phone: "95.761.910", birth_date: "1995-05-20" },
  { full_name: "ben dhieb salma", address: "cite riadh", phone: "", birth_date: "2015-06-06" },
  { full_name: "khadhraoui lina", address: "chat mariem", phone: "", birth_date: "2012-01-17" },
  { full_name: "ALI amira", address: "cite riadh", phone: "99.327.867", birth_date: "1975-04-10" },
  { full_name: "idoudi rihab", address: "cite riadh", phone: "27.965.203", birth_date: "2001-10-25" },
  { full_name: "friwi monjia", address: "cite riadh", phone: "27.040.399", birth_date: "1964-09-15" },
  { full_name: "ben amor mouhamed", address: "cite riadh", phone: "52.702.127", birth_date: "1983-09-22" },
  { full_name: "rezgni malak", address: "cite riadh", phone: "96.691.241", birth_date: "2016-05-07" },
  { full_name: "mehrzi ameni", address: "cite riadh", phone: "56.181.683", birth_date: "1993-04-23" },
  { full_name: "smida imen", address: "cite riadh", phone: "53.363.850", birth_date: "1985-01-02" },
  { full_name: "milami radhiya", address: "cite riadh", phone: "", birth_date: null },
  { full_name: "hamdi mariem", address: "cite riadh", phone: "58.800.419", birth_date: "2007-03-02" },
  { full_name: "mastour imen", address: "cite riadh", phone: "97.321.535", birth_date: "1994-02-24" },
  { full_name: "taktak rasem", address: "cite riadh", phone: "25.734.452", birth_date: "1997-01-19" },
  { full_name: "abidi rihab", address: "cite riadh", phone: "58.231.360", birth_date: "1994-07-30" },
  { full_name: "jlassi abed rahmen", address: "cite riadh", phone: "50.941.046", birth_date: "1986-08-21" },
  { full_name: "hamdi chahed", address: "cite riadh", phone: "56.343.325", birth_date: "2015-11-09" },
  { full_name: "idoudi rihab", address: "cite riadh", phone: "", birth_date: "1957-09-10" },
  { full_name: "afli ayssem", address: "cite riadh", phone: "20.847.347", birth_date: "2014-05-15" },
  { full_name: "sessi janette", address: "cite riadh", phone: "24.906.975", birth_date: "1972-10-07" },
  { full_name: "mahfouthi houda", address: "cite riadh", phone: "95.779.883", birth_date: "1982-10-09" },
  { full_name: "smach saif", address: "cite riadh", phone: "23.063.551", birth_date: "1990-12-17" },
  { full_name: "horbit rim", address: "cite riadh", phone: "52.343.325", birth_date: "1978-04-03" },
  { full_name: "hamdi aya", address: "cite riadh", phone: "56.602.995", birth_date: "2000-01-21" },
  { full_name: "ben mefteh firas", address: "cite riadh", phone: "27.251.939", birth_date: "2016-07-03" },
  { full_name: "selmi ali", address: "cite riadh", phone: "50.263.397", birth_date: "1966-09-14" },
  { full_name: "ousi moufida", address: "cite riadh", phone: "28.635.095", birth_date: "1973-01-01" },
  { full_name: "kardo sabiha", address: "cite riadh", phone: "56.800.972", birth_date: "2019-10-01" },
  { full_name: "amri bassma", address: "cite riadh", phone: "", birth_date: "1978-01-01" },
  { full_name: "daaloul maher", address: "cite riadh", phone: "", birth_date: null },
  { full_name: "chiheb manel", address: "cite riadh", phone: "97.287.444", birth_date: "1982-08-29" },
  { full_name: "selmi rayen", address: "cite riadh", phone: "56.634.790", birth_date: "2002-07-16" },
  { full_name: "hajji mariem", address: "cite riadh", phone: "92.309.909", birth_date: "2009-12-23" },
  { full_name: "fazzeii mouhamed", address: "cite riadh", phone: "27.040.399", birth_date: "1994-10-09" },
  { full_name: "hamdi riadh", address: "cite riadh", phone: "56.800.419", birth_date: "1997-10-15" },
  { full_name: "maalem zina", address: "cite riadh", phone: "28.808.945", birth_date: "1963-06-27" },
  { full_name: "jlassi bouraoui", address: "cite riadh", phone: "28.808.945", birth_date: "1956-12-09" },
  { full_name: "sehli ritej", address: "cite riadh", phone: "25.770.444", birth_date: "2009-11-19" },
  { full_name: "khlifi zohra", address: "cite riadh", phone: "95.408.549", birth_date: "1972-08-01" },
  { full_name: "hallous issam", address: "cite riadh", phone: "54.302.376", birth_date: "1982-12-02" },
  { full_name: "ben masoud sonia", address: "cite riadh", phone: "", birth_date: "1978-04-13" },
  { full_name: "abdi bochra", address: "cite riadh", phone: "94.060.760", birth_date: "1971-07-02" },
  { full_name: "jlassi mouhamed youssef", address: "cite riadh", phone: "93.234.340", birth_date: "2015-09-15" },
  { full_name: "ben abeda senda", address: "cite riadh", phone: "20.157.314", birth_date: "2012-11-25" },
  { full_name: "khifi habiba", address: "cite riadh", phone: "97.818.393", birth_date: "1974-04-09" },
  { full_name: "hdhiri rajia", address: "cite riadh", phone: "23.353.922", birth_date: "1982-03-23" },
  { full_name: "nawel lachter", address: "cite riadh", phone: "98.216.722", birth_date: "1986-03-12" },
  { full_name: "ben hriz ahmed", address: "cite riadh", phone: "98.216.722", birth_date: "2007-03-27" },
  { full_name: "briki sabrine", address: "cite riadh", phone: "50.322.905", birth_date: "1987-05-29" },
  { full_name: "bonzaen med chahin", address: "cite riadh", phone: "23.353.922", birth_date: "2012-06-28" },
  { full_name: "yazli abdallah", address: "cite riadh", phone: "27.260.488", birth_date: "1971-02-02" },
  { full_name: "thebti haifa", address: "cite riadh", phone: "94.742.334", birth_date: "1982-05-19" },
  { full_name: "al khalaf abdel aziz", address: "cite riadh", phone: "55.118.174", birth_date: "1974-01-01" },
  { full_name: "ben taieb mariem", address: "cite riadh", phone: "23.988.461", birth_date: "1991-11-06" },
  { full_name: "krioui zouhaier", address: "cite riadh", phone: "96.966.684", birth_date: "1980-11-17" },
  { full_name: "zmach bouraoui", address: "cite riadh", phone: "58.036.490", birth_date: "1962-04-18" },
  { full_name: "selmi fatma", address: "cite riadh", phone: "20.945.018", birth_date: "1970-01-01" },
  { full_name: "elnasri om el khir", address: "cite riadh", phone: "95.965.120", birth_date: "1960-01-15" },
  { full_name: "toumi jamel", address: "cite riadh", phone: "20.231.158", birth_date: "1958-10-25" },
  { full_name: "saaf rami", address: "cite riadh", phone: "54.544.219", birth_date: "1988-07-22" },
  { full_name: "thawedi abdel basset", address: "cite riadh", phone: "22.329.744", birth_date: "1969-07-08" },
  { full_name: "bahrouni soumaya", address: "cite riadh", phone: "24.325.238", birth_date: "1994-07-14" },
  { full_name: "abaydi bassma", address: "cite riadh", phone: "22.601.996", birth_date: "1989-07-29" },
];

const cleanPhone = (phone) => {
  if (!phone) return null;
  return phone.replace(/\s+/g, '');
};

const importPatients = async () => {
  try {
    console.log('🔄 Importation des patients dans PostgreSQL...');
    
    let successCount = 0;
    let errorCount = 0;
    let numeroFiche = 1;
    
    for (const patient of patientsData) {
      try {
        let birthDateFormatted = null;
        let age = null;
        
        if (patient.birth_date) {
          // Handle various date formats
          let dateStr = patient.birth_date.toString().trim();
          let birthDate;
          
          // Try YYYY-MM-DD format
          if (dateStr.includes('-')) {
            birthDate = new Date(dateStr);
          }
          // Try DD/MM/YYYY format
          else if (dateStr.includes('/')) {
            const [day, month, year] = dateStr.split('/');
            birthDate = new Date(year, month - 1, day);
          }
          // Try YYYY format only
          else if (dateStr.length === 4) {
            birthDate = new Date(dateStr, 0, 1);
          }
          
          if (birthDate && !isNaN(birthDate.getTime())) {
            birthDateFormatted = birthDate.toISOString().split('T')[0];
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
          }
        }
        
        await pool.query(
          `INSERT INTO patients 
            (full_name, address, phone, birth_date, age, paiement_status, 
             montant_total, montant_paye, montant_restant, numero_fiche, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
          [
            patient.full_name,
            patient.address || null,
            cleanPhone(patient.phone),
            birthDateFormatted,
            age,
            'non_paye',
            0, 0, 0,
            numeroFiche
          ]
        );
        
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`   ✓ ${successCount} patients importés...`);
        }
        numeroFiche++;
        
      } catch (error) {
        console.error(`❌ Erreur pour ${patient.full_name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Import terminé!`);
    console.log(`   ✓ ${successCount} patients importés avec succès`);
    if (errorCount > 0) {
      console.log(`   ❌ ${errorCount} erreurs`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    process.exit(1);
  }
};

importPatients();
