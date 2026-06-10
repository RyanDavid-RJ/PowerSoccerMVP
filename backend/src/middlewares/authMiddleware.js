const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'power_soccer_secret_key_2025';

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ erro: 'Token não fornecido ou formato inválido' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, iat, exp }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ erro: 'Token expirado' });
        }
        return res.status(403).json({ erro: 'Token inválido' });
    }
}

module.exports = authMiddleware;