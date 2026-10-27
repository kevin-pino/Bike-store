const carritoService = require('../services/carrito.service');

async function get(req, res, next) {
    try {
        res.json({ ok: true, data: await carritoService.getCarrito(req.user.id_usuario) });
    } catch (error) { next(error); }
}

async function add(req, res, next) {
    try {
        await carritoService.agregarProducto(req.user.id_usuario, req.body.id_producto, req.body.cantidad);
        res.status(201).json({ ok: true, message: 'Producto agregado al carrito' });
    } catch (error) { next(error); }
}

async function update(req, res, next) {
    try {
        await carritoService.actualizarCantidad(req.user.id_usuario, req.params.idProducto, req.body.cantidad);
        res.json({ ok: true, message: 'Cantidad actualizada' });
    } catch (error) { next(error); }
}

async function remove(req, res, next) {
    try {
        await carritoService.quitarProducto(req.user.id_usuario, req.params.idProducto);
        res.json({ ok: true, message: 'Producto retirado del carrito' });
    } catch (error) { next(error); }
}

module.exports = { get, add, update, remove };
