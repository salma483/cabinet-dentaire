// backend/controllers/authController.js
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        console.log(`📊 Résultat SQL: ${users.length} utilisateur(s) trouvé(s)`);
        
        if (users.length === 0) {
            console.log('❌ Utilisateur non trouvé');
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const user = users[0];
        console.log(`👤 Utilisateur: ${user.full_name}`);
        
        // Vérification bcrypt pour tous les mots de passe
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
                full_name: user.full_name,
                role: user.role || 'admin'
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );

        console.log('🎫 Token généré avec succès');
        console.log('=== FIN CONNEXION ===\n');

        res.json({
            success: true,
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role || 'admin'
            }
        });
        
    } catch (error) {
        console.error('💥 ERREUR:', error);
        res.status(500).json({ 
            message: 'Erreur serveur', 
            error: error.message 
        });
    }
};

// Nouvelle fonction pour mettre à jour le profil
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, currentPassword, newPassword } = req.body;

        // Récupérer l'utilisateur actuel
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const user = users[0];
        const updates = [];
        const values = [];

        // Vérifier et mettre à jour l'email
        if (email && email !== user.email) {
            // Vérifier si le nouvel email n'est pas déjà utilisé
            const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
            if (existingUsers.length > 0) {
                return res.status(400).json({ message: 'Cet email est déjà utilisé' });
            }
            updates.push('email = ?');
            values.push(email);
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
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'Aucune modification demandée' });
        }

        // Exécuter la mise à jour
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        values.push(userId);
        
        await pool.query(query, values);

        // Récupérer l'utilisateur mis à jour
        const [updatedUser] = await pool.query('SELECT id, email, full_name, role FROM users WHERE id = ?', [userId]);

        res.json({
            success: true,
            message: 'Profil mis à jour avec succès',
            user: updatedUser[0]
        });

    } catch (error) {
        console.error('Erreur update profile:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

module.exports = { login, updateProfile };