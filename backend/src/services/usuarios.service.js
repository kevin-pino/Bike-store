const pool = require('../config/db');
const AppError = require('../utils/AppError');

function validarId(id) {
    const numero = Number(id);
    if (!Number.isInteger(numero) || numero < 1) throw new AppError('Identificador de usuario inválido', 400);
    return numero;
}

async function listUsuarios(busqueda = '') {
    const termino = String(busqueda || '').trim().slice(0, 100);
    const like = `%${termino}%`;
    const [rows] = await pool.execute(
        `SELECT id_usuario, nombre, email, rol, activo, created_at
         FROM usuarios
         WHERE ? = '' OR nombre LIKE ? OR email LIKE ?
         ORDER BY created_at DESC`,
        [termino, like, like]
    );
    return rows;
}

async function getUsuario(id) {
    const usuarioId = validarId(id);
    const [rows] = await pool.execute(
        'SELECT id_usuario, nombre, email, rol, activo FROM usuarios WHERE id_usuario = ?',
        [usuarioId]
    );
    if (!rows.length) throw new AppError('Usuario no encontrado', 404);
    return rows[0];
}

async function updateRol(id, rol, actorId) {
    const usuarioId = validarId(id);
    if (!['admin', 'cliente'].includes(rol)) throw new AppError('El rol debe ser admin o cliente', 400);
    if (usuarioId === Number(actorId)) throw new AppError('No puedes cambiar tu propio rol', 400);
    const usuario = await getUsuario(usuarioId);
    if (usuario.rol === 'admin' && usuario.activo && rol !== 'admin') {
        const [[{ total }]] = await pool.execute(
            "SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'admin' AND activo = 1"
        );
        if (Number(total) <= 1) throw new AppError('No se puede retirar el último administrador activo', 409);
    }
    await pool.execute('UPDATE usuarios SET rol = ? WHERE id_usuario = ?', [rol, usuarioId]);
}

async function setActivo(id, activo, actorId) {
    const usuarioId = validarId(id);
    if (typeof activo !== 'boolean') throw new AppError('El estado activo debe ser verdadero o falso', 400);
    if (usuarioId === Number(actorId) && !activo) throw new AppError('No puedes desactivar tu propia cuenta', 400);
    const usuario = await getUsuario(usuarioId);
    if (usuario.rol === 'admin' && usuario.activo && !activo) {
        const [[{ total }]] = await pool.execute(
            "SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'admin' AND activo = 1"
        );
        if (Number(total) <= 1) throw new AppError('No se puede desactivar el último administrador activo', 409);
    }
    await pool.execute('UPDATE usuarios SET activo = ? WHERE id_usuario = ?', [activo ? 1 : 0, usuarioId]);
}

module.exports = { listUsuarios, updateRol, setActivo };
