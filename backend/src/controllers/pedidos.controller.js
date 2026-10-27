const pedidosService = require('../services/pedidos.service');

async function checkout(req, res, next) {
    try {
        const data = await pedidosService.finalizarCompra(req.user.id_usuario, req.body);
        res.status(201).json({ ok: true, data });
    } catch (error) { next(error); }
}

async function listMine(req, res, next) {
    try {
        const data = await pedidosService.getMisPedidos(req.user.id_usuario);
        res.json({ ok: true, data });
    } catch (error) { next(error); }
}

module.exports = { checkout, listMine };
