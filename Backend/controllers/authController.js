// backend/controllers/authController.js
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const FALLBACK_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@dentiste.com';
const FALLBACK_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
const FRONTEND_FALLBACK_EMAIL = 'dr.ayadineder@gmail.com';
const FRONTEND_FALLBACK_PASSWORD = 'ayadineder2024';

const isDatabaseUnavailable = (error) => {
    return error && (
        error.code === 'ECONNREFUSED' ||
        error.code === '28P01' ||
        error.code === '08001' ||
        error.message?.includes('connect') ||
        error.message?.includes('timeout')
    );
};

const login = async (req, res) => {
    console.log('=== NOUVELLE TENTATIVE DE CONNEXION ===');
    console.log('Body reçu:', req.body);
    
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            console.log('❌ Email ou mot de passe manquant');
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }
        
        console.log(`📧 Email: ${email}`);

        try {
            const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            const users = result.rows;
            
            console.log(`📊 Résultat SQL: ${users.length} utilisateur(s) trouvé(s)`);
            
            if (users.length === 0) {
                console.log('❌ Utilisateur non trouvé');
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            const user = users[0];
            console.log(`👤 Utilisateur: ${user.email}`);
            
            const passwordValid = await bcrypt.compare(password, user.password);
            
            if (!passwordValid) {
                console.log('❌ Mot de passe incorrect');
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            console.log('✅ Mot de passe correct !');

            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email,
                    role: user.role || 'admin'
                },
                process.env.JWT_SECRET || 'secret_key',
                { expiresIn: '24h' }
            );

            console.log('🎫 Token généré avec succès');
            console.log('=== FIN CONNEXION ===\n');

            return res.json({
                success: true,
                message: 'Connexion réussie',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role || 'admin'
                }
            });
        } catch (error) {
            const isFallbackCredentials =
                (email === FALLBACK_ADMIN_EMAIL && password === FALLBACK_ADMIN_PASSWORD) ||
                (email === FRONTEND_FALLBACK_EMAIL && password === FRONTEND_FALLBACK_PASSWORD);

            if (isDatabaseUnavailable(error) && isFallbackCredentials) {
                const fallbackEmail = email === FRONTEND_FALLBACK_EMAIL ? FRONTEND_FALLBACK_EMAIL : FALLBACK_ADMIN_EMAIL;
                console.warn(`⚠️ Base de données indisponible, connexion fallback activée pour ${fallbackEmail}`);
                const fallbackToken = jwt.sign(
                    { id: 1, email: fallbackEmail, role: 'admin' },
                    process.env.JWT_SECRET || 'secret_key',
                    { expiresIn: '24h' }
                );

                return res.json({
                    success: true,
                    message: 'Connexion réussie (mode secours)',
                    token: fallbackToken,
                    user: {
                        id: 1,
                        email: fallbackEmail,
                        role: 'admin'
                    }
                });
            }

            throw error;
        }
        
    } catch (error) {
        console.error('💥 ERREUR:', error);
        res.status(503).json({ 
            message: 'Service de connexion indisponible',
            error: error.message || error.code || 'Erreur serveur'
        });
    }
};

// Nouvelle fonction pour mettre à jour le profil
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, currentPassword, newPassword } = req.body;

        // Récupérer l'utilisateur actuel
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        const users = result.rows;
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const user = users[0];
        const updates = [];
        const values = [];
        let paramCount = 1;

        // Vérifier et mettre à jour l'email
        if (email && email !== user.email) {
            // Vérifier si le nouvel email n'est pas déjà utilisé
            const checkResult = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
            if (checkResult.rows.length > 0) {
                return res.status(400).json({ message: 'Cet email est déjà utilisé' });
            }
            updates.push(`email = $${paramCount}`);
            values.push(email);
            paramCount++;
        }

        // Vérifier et mettre à jour le mot de passe
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Le mot de passe actuel est requis' });
            }
            
            // Vérifier l'ancien mot de passe
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
            }
            
            // Hasher le nouveau mot de passe
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updates.push(`password = $${paramCount}`);
            values.push(hashedPassword);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'Aucune modification demandée' });
        }

        // Exécuter la mise à jour
        values.push(userId);
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`;
        
        await pool.query(query, values);

        // Récupérer l'utilisateur mis à jour
        const updatedResult = await pool.query('SELECT id, email, full_name, role FROM users WHERE id = $1', [userId]);
        const updatedUser = updatedResult.rows[0];

        res.json({
            success: true,
            message: 'Profil mis à jour avec succès',
            user: updatedUser
        });

    } catch (error) {
        console.error('Erreur update profile:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

module.exports = { login, updateProfile };