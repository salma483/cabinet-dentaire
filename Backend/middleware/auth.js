// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Accès non autorisé - Token manquant' 
        });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        req.user = verified;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ 
                success: false,
                message: 'Session expirée, veuillez vous reconnecter' 
            });
        }
        return res.status(403).json({ 
            success: false,
            message: 'Token invalide' 
        });
    }
};

module.exports = authenticateToken;