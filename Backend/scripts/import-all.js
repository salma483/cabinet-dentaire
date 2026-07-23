// backend/scripts/import-all.js
const { Pool } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dentist_dashboard',
    port: process.env.DB_PORT || 5432,
});

async function importAll() {
    try {
        console.log('🚀 IMPORTATION TOTALE DES PATIENTS');
        console.log('====================================');
        
        // Chemin vers le fichier sur le Bureau
        const filePath = 'C:/Users/salma/Desktop/DOCTEUR NEDER AYADI2.xlsx';
        console.log(`📂 Fichier: ${filePath}`);
        
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets['Feuil1'];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        console.log(`📊 ${data.length} lignes dans le fichier`);
        
        // VIDER LA TABLE PATIENTS
        console.log('🗑️ Suppression des patients existants...');
        await pool.query('TRUNCATE TABLE patients CASCADE');
        console.log('✅ Patients supprimés');
        
        let successCount = 0;
        let errorCount = 0;
        let numeroFiche = 1;
        
        console.log('📥 Importation en cours...');
        
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || !row[0]) continue;
            
            const full_name = String(row[0] || '').trim();
            if (!full_name || full_name === '') continue;
            
            const birth_date = formatDate(row[1]);
            const phone = cleanPhone(row[2]);
            const address = String(row[3] || '').trim();
            
            try {
                await pool.query(
                    `INSERT INTO patients 
                        (full_name, birth_date, phone, address, numero_fiche, paiement_status)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [full_name, birth_date, phone, address, numeroFiche, 'non_paye']
                );
                successCount++;
                numeroFiche++;
                
                if (successCount % 100 === 0) {
                    console.log(`   ✅ ${successCount} patients importés...`);
                }
            } catch (error) {
                errorCount++;
                console.log(`   ❌ Erreur ligne ${i+1}: ${full_name} - ${error.message}`);
            }
        }
        
        console.log('\n====================================');
        console.log(`✅ IMPORT TERMINÉ !`);
        console.log(`   📋 ${successCount} patients importés avec succès`);
        if (errorCount > 0) {
            console.log(`   ⚠️ ${errorCount} erreurs (patients ignorés)`);
        }
        console.log(`   📁 Dernier numéro de fiche: ${numeroFiche - 1}`);
        console.log('====================================');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ ERREUR:', error);
        process.exit(1);
    }
}

function formatDate(value) {
    if (!value) return null;
    let str = String(value).trim();
    
    if (str.match(/^\d{4}$/)) return `${str}-01-01`;
    if (str.match(/^\d+ans$/i)) {
        const year = new Date().getFullYear() - parseInt(str);
        return `${year}-01-01`;
    }
    if (str.match(/^\d{4}-\d{2}-\d{2}/)) return str.substring(0, 10);
    
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
            let day = parts[0].padStart(2, '0');
            let month = parts[1].padStart(2, '0');
            let year = parts[2];
            if (year.length === 2) year = parseInt(year) > 30 ? `19${year}` : `20${year}`;
            if (parseInt(day) > 0 && parseInt(day) <= 31 && parseInt(month) > 0 && parseInt(month) <= 12) {
                return `${year}-${month}-${day}`;
            }
        }
    }
    
    if (str.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        const parts = str.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
    }
    
    try {
        const date = new Date(str);
        if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {}
    
    return null;
}

function cleanPhone(value) {
    if (!value) return null;
    let str = String(value).trim();
    str = str.replace(/[.\s\-/]/g, '');
    str = str.replace(/[^0-9+]/g, '');
    if (str.length > 20) str = str.substring(0, 20);
    return str || null;
}

importAll();