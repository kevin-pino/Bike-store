const productosService = require('../services/equipos.service');

async function listPublic(req, res, next) {
    try {
        res.json({ ok: true, data: await productosService.listProductos() });
    } catch (error) {
        next(error);
    }
}

async function listAdmin(req, res, next) {
    try {
        res.json({ ok: true, data: await productosService.listTodosProductos() });
    } catch (error) {
        next(error);
    }
}

async function getById(req, res, next) {
    try {
        res.json({ ok: true, data: await productosService.getProductoById(req.params.id) });
    } catch (error) {
        next(error);
    }
}

async function create(req, res, next) {
    try {
        const data = await productosService.createProducto(
            req.body,
            req.files?.imagen?.[0]?.filename,
            req.files?.imagenes || []
        );
        res.status(201).json({ ok: true, data });
    } catch (error) {
        await limpiarImagenesCargadas(req);
        next(error);
    }
}

async function update(req, res, next) {
    try {
        await productosService.updateProducto(
            req.params.id,
            req.body,
            req.files?.imagen?.[0]?.filename,
            req.files?.imagenes || [],
            req.body.eliminarImagenPrincipal === 'true',
            [].concat(req.body.imagenesEliminar || [])
        );
        res.json({ ok: true, message: 'Producto actualizado' });
    } catch (error) {
        await limpiarImagenesCargadas(req);
        next(error);
    }
}

async function limpiarImagenesCargadas(req) {
    const archivos = Object.values(req.files || {}).flat();
    await Promise.all(archivos.map((archivo) => productosService.borrarImagenSiExiste(archivo.filename)));
}

async function setActive(req, res, next) {
    try {
        await productosService.setProductoActivo(req.params.id, req.body.activo);
        res.json({ ok: true, message: 'Estado del producto actualizado' });
    } catch (error) {
        next(error);
    }
}

module.exports = { listPublic, listAdmin, getById, create, update, setActive };
