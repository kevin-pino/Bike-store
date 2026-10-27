const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { createToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

function normalizarEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function validarEmail(email) {
    const formatoEmail = /^[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,63}$/i;
    const partes = email.split('@');
    if (
        partes.length !== 2 ||
        email.length > 150 ||
        partes[0].length > 64 ||
        !formatoEmail.test(email)
    ) {
        throw new AppError('El correo electrónico no tiene un formato válido', 400);
    }
}

function validarPassword(password) {
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
        throw new AppError('La contraseña debe tener entre 8 y 72 caracteres', 400);
    }
}

async function registerUser({ nombre, email, password }) {
    const emailNormalizado = normalizarEmail(email);
    const nombreNormalizado = String(nombre || '').trim();
    if (!nombreNormalizado || !emailNormalizado || !password) {
        throw new AppError('nombre, email y password son obligatorios', 400);
    }
    if (nombreNormalizado.length > 100) throw new AppError('El nombre excede la longitud permitida', 400);
    validarEmail(emailNormalizado);
    validarPassword(password);

    const [existing] = await pool.execute('SELECT id_usuario FROM usuarios WHERE email = ?', [emailNormalizado]);
    if (existing.length) throw new AppError('El correo ya está registrado', 409);

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
        'INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, 1)',
        [nombreNormalizado, emailNormalizado, hash, 'cliente']
    );
    return { id_usuario: result.insertId };
}

async function loginUser({ email, password }) {
    const emailNormalizado = normalizarEmail(email);
    if (!emailNormalizado || !password) throw new AppError('email y password son obligatorios', 400);
    const [rows] = await pool.execute(
        'SELECT id_usuario, nombre, email, password, rol, activo FROM usuarios WHERE email = ?',
        [emailNormalizado]
    );
    if (!rows.length) throw new AppError('Credenciales incorrectas', 401);
    const user = rows[0];
    if (!user.activo) throw new AppError('La cuenta está inactiva; contacta al administrador', 403);
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError('Credenciales incorrectas', 401);
    delete user.password;
    return { user, token: createToken(user) };
}

async function emailRegistrado(email) {
    const emailNormalizado = normalizarEmail(email);
    validarEmail(emailNormalizado);
    const [rows] = await pool.execute(
        'SELECT id_usuario FROM usuarios WHERE email = ? AND activo = 1',
        [emailNormalizado]
    );
    return rows.length > 0;
}

async function resetPassword(email, password) {
    const emailNormalizado = normalizarEmail(email);
    validarEmail(emailNormalizado);
    validarPassword(password);
    const [users] = await pool.execute(
        'SELECT id_usuario FROM usuarios WHERE email = ? AND activo = 1',
        [emailNormalizado]
    );
    if (!users.length) throw new AppError('No hay una cuenta activa registrada con ese correo', 404);
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
        'UPDATE usuarios SET password = ? WHERE id_usuario = ? AND activo = 1',
        [hash, users[0].id_usuario]
    );
    if (!result.affectedRows) throw new AppError('La cuenta ya no está activa', 404);
}

module.exports = { registerUser, loginUser, emailRegistrado, resetPassword };
