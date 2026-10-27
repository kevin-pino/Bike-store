const usuariosService = require('../services/usuarios.service');

async function list(req, res, next) {
    try {
        const data = await usuariosService.listUsuarios(req.query.busqueda);
        res.json({ ok: true, data });
    } catch (error) { next(error); }
}

async function updateRole(req, res, next) {
    try {
        await usuariosService.updateRol(req.params.id, req.body.rol, req.user.id_usuario);
        res.json({ ok: true, message: 'Rol actualizado' });
    } catch (error) { next(error); }
}

async function setActive(req, res, next) {
    try {
        await usuariosService.setActivo(req.params.id, req.body.activo, req.user.id_usuario);
        res.json({ ok: true, message: 'Estado de la cuenta actualizado' });
    } catch (error) { next(error); }
}

module.exports = { list, updateRole, setActive };
