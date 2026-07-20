// backend/test-api.js
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = '';

async function testAPI() {
    console.log('🦷 TEST DE L\'API DU CABINET DENTAIRE\n');

    try {
        // 1. Test de connexion
        console.log('1️⃣ Test de connexion...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'dr.ayadineder@gmail.com',
            password: 'ayadineder2024'
        });
        token = loginRes.data.token;
        console.log('✅ Connexion réussie\n');

        // 2. Récupérer les patients
        console.log('2️⃣ Récupération des patients...');
        const patientsRes = await axios.get(`${API_URL}/patients`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ ${patientsRes.data.length} patients trouvés\n`);

        // 3. Récupérer les rendez-vous
        console.log('3️⃣ Récupération des rendez-vous...');
        const appointmentsRes = await axios.get(`${API_URL}/appointments`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ ${appointmentsRes.data.length} rendez-vous trouvés\n`);

        // 4. Récupérer les paiements
        console.log('4️⃣ Récupération des paiements...');
        const paiementsRes = await axios.get(`${API_URL}/paiements`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ ${paiementsRes.data.length} paiements trouvés\n`);

        console.log('🎉 TOUS LES TESTS RÉUSSIS !');
        
    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
    }
}

testAPI();