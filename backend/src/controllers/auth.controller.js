const authService = require('../services/auth.service');

async function register(req, res, next) {
    try {
        const { id_usuario } = await authService.registerUser(req.body);

        return res.status(201).json({ 
            ok: true,
            message: 'Cuenta creada. Ya puedes iniciar sesión con el correo y la contraseña registrados.',
            id_usuario
        });
    } catch (error) {
        next(error);
    }
    }

async function login(req, res, next) {
    try {
        const { user, token } = await authService.loginUser(req.body);
        return res.json({ ok: true, user, token});
    } catch (error) {
        next(error);
    }
}

async function requestPasswordReset(req, res, next) {
    try {
        const existe = await authService.emailRegistrado(req.body?.email);
        return res.json({ ok: true, existe });
    } catch (error) { next(error); }
}

async function resetPassword(req, res, next) {
    try {
        await authService.resetPassword(req.body?.email, req.body?.password);
        return res.json({ ok: true, message: 'La contraseña fue actualizada. Ya puedes iniciar sesión.' });
    } catch (error) { next(error); }
}

module.exports = { register, login, requestPasswordReset, resetPassword };
