// backend/controllers/medicamentController.js
const pool = require('../config/database');

// Récupérer tous les médicaments
const getAllMedicaments = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM medicaments ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Récupérer un médicament par ID
const getMedicamentById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM medicaments WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Médicament non trouvé' });
        }
        
        res.json(result.rows[0]);
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
            prix,
            stock = 0,
            description,
            dosage
        } = req.body;

        if (!nom || !prix) {
            return res.status(400).json({ message: 'Le nom et le prix sont requis' });
        }

        const result = await pool.query(`
            INSERT INTO medicaments (nom, prix, stock, description, dosage)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [nom, prix, stock, description || null, dosage || null]);

        res.status(201).json({
            success: true,
            message: 'Médicament ajouté avec succès',
            medicament: result.rows[0]
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
        const oldDataResult = await pool.query('SELECT quantite_disponible FROM medicaments WHERE id = $1', [id]);
        if (oldDataResult.rows.length === 0) {
            return res.status(404).json({ message: 'Médicament non trouvé' });
        }
        const oldData = oldDataResult.rows;

        // Calculer le statut
        let statut = 'disponible';
        if (quantite_disponible === 0) {
            statut = 'rupture';
        } else if (quantite_disponible <= alerte_stock) {
            statut = 'stock_faible';
        }

        await pool.query(`
            UPDATE medicaments 
            SET nom = $1, prix_unitaire = $2, quantite_achetee = $3, quantite_disponible = $4,
                statut = $5, description = $6, fournisseur = $7, date_expiration = $8, alerte_stock = $9
            WHERE id = $10
        `, [nom, prix_unitaire, quantite_achetee, quantite_disponible, statut, description, fournisseur, date_expiration, alerte_stock, id]);

        // Ajouter mouvement si quantité changée
        const quantiteDiff = quantite_disponible - oldData[0].quantite_disponible;
        if (quantiteDiff !== 0) {
            const typeMouvement = quantiteDiff > 0 ? 'entree' : 'sortie';
            await pool.query(`
                INSERT INTO stock_mouvements (medicament_id, type_mouvement, quantite, raison)
                VALUES ($1, $2, $3, 'Mise à jour manuelle')
            `, [id, typeMouvement, Math.abs(quantiteDiff)]);
        }

        const updatedMedicamentResult = await pool.query('SELECT * FROM medicaments WHERE id = $1', [id]);
        
        res.json({
            success: true,
            message: 'Médicament mis à jour',
            medicament: updatedMedicamentResult.rows[0]
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
        await pool.query('DELETE FROM stock_mouvements WHERE medicament_id = $1', [id]);
        await pool.query('DELETE FROM medicaments WHERE id = $1', [id]);
        
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
        const medicamentsResult = await pool.query('SELECT * FROM medicaments WHERE id = $1', [id]);
        const medicaments = medicamentsResult.rows;
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
                SET quantite_disponible = $1, quantite_achetee = quantite_achetee + $2
                WHERE id = $3
            `, [nouvelleQuantite, quantite, id]);
        } else if (type === 'sortie') {
            if (quantite > medicament.quantite_disponible) {
                return res.status(400).json({ message: 'Stock insuffisant' });
            }
            nouvelleQuantite -= quantite;
            await pool.query('UPDATE medicaments SET quantite_disponible = $1 WHERE id = $2', [nouvelleQuantite, id]);
        } else {
            return res.status(400).json({ message: 'Type de mouvement invalide' });
        }

        // Ajouter au mouvement
        await pool.query(`
            INSERT INTO stock_mouvements (medicament_id, type_mouvement, quantite, raison)
            VALUES ($1, $2, $3, $4)
        `, [id, typeMouvement, quantite, raison || 'Ajustement manuel']);

        // Mettre à jour le statut
        let statut = 'disponible';
        if (nouvelleQuantite === 0) {
            statut = 'rupture';
        } else if (nouvelleQuantite <= medicament.alerte_stock) {
            statut = 'stock_faible';
        }
        await pool.query('UPDATE medicaments SET statut = $1 WHERE id = $2', [statut, id]);

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
        const statsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_medicaments,
                SUM(CASE WHEN statut = 'disponible' THEN 1 ELSE 0 END) as disponibles,
                SUM(CASE WHEN statut = 'stock_faible' THEN 1 ELSE 0 END) as stock_faible,
                SUM(CASE WHEN statut = 'rupture' THEN 1 ELSE 0 END) as rupture,
                SUM(quantite_disponible) as total_unites,
                SUM(prix_unitaire * quantite_disponible) as valeur_stock
            FROM medicaments
        `);
        
        res.json(statsResult.rows[0]);
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Récupérer l'historique des mouvements
const getMouvements = async (req, res) => {
    try {
        const { id } = req.params;
        const mouvementsResult = await pool.query(`
            SELECT sm.*, m.nom as medicament_nom
            FROM stock_mouvements sm
            JOIN medicaments m ON sm.medicament_id = m.id
            WHERE sm.medicament_id = $1
            ORDER BY sm.date_mouvement DESC
        `, [id]);
        const mouvements = mouvementsResult.rows;
        
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