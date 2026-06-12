// backend/controllers/medicamentController.js
const pool = require('../config/database');

// Récupérer tous les médicaments
const getAllMedicaments = async (req, res) => {
    try {
        const [medicaments] = await pool.query(`
            SELECT 
                m.*,
                (SELECT COUNT(*) FROM stock_mouvements WHERE medicament_id = m.id) as nb_mouvements
            FROM medicaments m 
            ORDER BY m.created_at DESC
        `);
        res.json(medicaments);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Récupérer un médicament par ID
const getMedicamentById = async (req, res) => {
    try {
        const { id } = req.params;
        const [medicaments] = await pool.query('SELECT * FROM medicaments WHERE id = ?', [id]);
        
        if (medicaments.length === 0) {
            return res.status(404).json({ message: 'Médicament non trouvé' });
        }
        
        res.json(medicaments[0]);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Ajouter un médicament
const addMedicament = async (req, res) => {
    try {
        const {
            nom,
            prix_unitaire,
            quantite_achetee,
            quantite_disponible,
            description,
            fournisseur,
            date_expiration,
            alerte_stock = 5
        } = req.body;

        // Validation
        if (!nom || !prix_unitaire) {
            return res.status(400).json({ message: 'Le nom et le prix unitaire sont requis' });
        }

        // Calculer le statut
        let statut = 'disponible';
        if (quantite_disponible === 0) {
            statut = 'rupture';
        } else if (quantite_disponible <= alerte_stock) {
            statut = 'stock_faible';
        }

        const [result] = await pool.query(`
            INSERT INTO medicaments 
            (nom, prix_unitaire, quantite_achetee, quantite_disponible, statut, description, fournisseur, date_expiration, alerte_stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [nom, prix_unitaire, quantite_achetee || 0, quantite_disponible || 0, statut, description, fournisseur, date_expiration, alerte_stock]);

        // Ajouter au stock mouvement
        if (quantite_achetee > 0) {
            await pool.query(`
                INSERT INTO stock_mouvements (medicament_id, type_mouvement, quantite, raison)
                VALUES (?, 'entree', ?, 'Achat initial')
            `, [result.insertId, quantite_achetee]);
        }

        const [newMedicament] = await pool.query('SELECT * FROM medicaments WHERE id = ?', [result.insertId]);
        
        res.status(201).json({
            success: true,
            message: 'Médicament ajouté avec succès',
            medicament: newMedicament[0]
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Mettre à jour un médicament
const updateMedicament = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nom,
            prix_unitaire,
            quantite_achetee,
            quantite_disponible,
            description,
            fournisseur,
            date_expiration,
            alerte_stock
        } = req.body;

        // Récupérer l'ancienne quantité pour calculer la différence
        const [oldData] = await pool.query('SELECT quantite_disponible FROM medicaments WHERE id = ?', [id]);
        if (oldData.length === 0) {
            return res.status(404).json({ message: 'Médicament non trouvé' });
        }

        // Calculer le statut
        let statut = 'disponible';
        if (quantite_disponible === 0) {
            statut = 'rupture';
        } else if (quantite_disponible <= alerte_stock) {
            statut = 'stock_faible';
        }

        await pool.query(`
            UPDATE medicaments 
            SET nom = ?, prix_unitaire = ?, quantite_achetee = ?, quantite_disponible = ?,
                statut = ?, description = ?, fournisseur = ?, date_expiration = ?, alerte_stock = ?
            WHERE id = ?
        `, [nom, prix_unitaire, quantite_achetee, quantite_disponible, statut, description, fournisseur, date_expiration, alerte_stock, id]);

        // Ajouter mouvement si quantité changée
        const quantiteDiff = quantite_disponible - oldData[0].quantite_disponible;
        if (quantiteDiff !== 0) {
            const typeMouvement = quantiteDiff > 0 ? 'entree' : 'sortie';
            await pool.query(`
                INSERT INTO stock_mouvements (medicament_id, type_mouvement, quantite, raison)
                VALUES (?, ?, ?, 'Mise à jour manuelle')
            `, [id, typeMouvement, Math.abs(quantiteDiff)]);
        }

        const [updatedMedicament] = await pool.query('SELECT * FROM medicaments WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: 'Médicament mis à jour',
            medicament: updatedMedicament[0]
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Supprimer un médicament
const deleteMedicament = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Supprimer d'abord les mouvements associés
        await pool.query('DELETE FROM stock_mouvements WHERE medicament_id = ?', [id]);
        await pool.query('DELETE FROM medicaments WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'Médicament supprimé' });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Mettre à jour le stock
const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantite, type, raison } = req.body;

        if (!quantite || quantite <= 0) {
            return res.status(400).json({ message: 'Quantité invalide' });
        }

        // Récupérer le médicament
        const [medicaments] = await pool.query('SELECT * FROM medicaments WHERE id = ?', [id]);
        if (medicaments.length === 0) {
            return res.status(404).json({ message: 'Médicament non trouvé' });
        }

        const medicament = medicaments[0];
        let nouvelleQuantite = medicament.quantite_disponible;
        let typeMouvement = type;

        if (type === 'entree') {
            nouvelleQuantite += quantite;
            await pool.query(`
                UPDATE medicaments 
                SET quantite_disponible = ?, quantite_achetee = quantite_achetee + ?
                WHERE id = ?
            `, [nouvelleQuantite, quantite, id]);
        } else if (type === 'sortie') {
            if (quantite > medicament.quantite_disponible) {
                return res.status(400).json({ message: 'Stock insuffisant' });
            }
            nouvelleQuantite -= quantite;
            await pool.query('UPDATE medicaments SET quantite_disponible = ? WHERE id = ?', [nouvelleQuantite, id]);
        } else {
            return res.status(400).json({ message: 'Type de mouvement invalide' });
        }

        // Ajouter au mouvement
        await pool.query(`
            INSERT INTO stock_mouvements (medicament_id, type_mouvement, quantite, raison)
            VALUES (?, ?, ?, ?)
        `, [id, typeMouvement, quantite, raison || (type === 'entree' ? 'Entrée stock' : 'Sortie stock')]);

        // Mettre à jour le statut
        let statut = 'disponible';
        if (nouvelleQuantite === 0) {
            statut = 'rupture';
        } else if (nouvelleQuantite <= medicament.alerte_stock) {
            statut = 'stock_faible';
        }
        await pool.query('UPDATE medicaments SET statut = ? WHERE id = ?', [statut, id]);

        res.json({
            success: true,
            message: 'Stock mis à jour',
            nouvelle_quantite: nouvelleQuantite,
            statut: statut
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Récupérer les statistiques
const getStats = async (req, res) => {
    try {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_medicaments,
                SUM(CASE WHEN statut = 'disponible' THEN 1 ELSE 0 END) as disponibles,
                SUM(CASE WHEN statut = 'stock_faible' THEN 1 ELSE 0 END) as stock_faible,
                SUM(CASE WHEN statut = 'rupture' THEN 1 ELSE 0 END) as rupture,
                SUM(quantite_disponible) as total_unites,
                SUM(prix_unitaire * quantite_disponible) as valeur_stock
            FROM medicaments
        `);
        
        res.json(stats[0]);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Récupérer l'historique des mouvements
const getMouvements = async (req, res) => {
    try {
        const { id } = req.params;
        const [mouvements] = await pool.query(`
            SELECT sm.*, m.nom as medicament_nom
            FROM stock_mouvements sm
            JOIN medicaments m ON sm.medicament_id = m.id
            WHERE sm.medicament_id = ?
            ORDER BY sm.date_mouvement DESC
        `, [id]);
        
        res.json(mouvements);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    getAllMedicaments,
    getMedicamentById,
    addMedicament,
    updateMedicament,
    deleteMedicament,
    updateStock,
    getStats,
    getMouvements
};