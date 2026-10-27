const jwt = require('jsonwebtoken');
const env = require('../config/env');
const pool = require('../config/db');

async function authenticate(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({
            ok: false,
            message: 'Token requerido'
        });
    }

    const token = header.substring(7);

    let decoded;
    try {
        decoded = jwt.verify(token, env.jwt.secret);
    } catch (error) {
        return res.status(401).json({
            ok: false,
            message: 'Token inválido o expirado'
        });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT id_usuario, nombre, email, rol, activo FROM usuarios WHERE id_usuario = ?',
            [decoded.id_usuario]
        );
        if (!rows.length || !rows[0].activo) {
            return res.status(401).json({ ok: false, message: 'La cuenta no está disponible' });
        }
        // Rol y estado actuales de la base de datos: revoca acceso inmediatamente al cambiar la cuenta.
        req.user = rows[0];
        next();
    } catch (error) {
        next(error);
    }
}

function authorize(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({
            ok: false,
            message: 'No tienes permisos para realizar esta operación'
        });
        }
        next();
    };
}

module.exports = { authenticate, authorize};
