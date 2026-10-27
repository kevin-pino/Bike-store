const fs = require('fs/promises');
const path = require('path');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { UPLOAD_DIR } = require('../middlewares/upload.middleware');

async function agregarImagenes(rows, executor = pool) {
    if (!rows.length) return rows;
    const ids = rows.map((row) => row.id_producto);
    const placeholders = ids.map(() => '?').join(', ');
    const [images] = await executor.execute(
        `SELECT id_imagen, id_producto, archivo FROM producto_imagenes
         WHERE id_producto IN (${placeholders}) ORDER BY id_imagen`,
        ids
    );
    const byProduct = new Map(ids.map((id) => [id, []]));
    for (const image of images) byProduct.get(image.id_producto)?.push(image);
    return rows.map((row) => ({ ...row, imagenes: byProduct.get(row.id_producto) || [] }));
}

async function borrarImagenSiExiste(imagen) {
    if (!imagen) return;
    if (path.basename(imagen) !== imagen) return;
    try {
        await fs.unlink(path.join(UPLOAD_DIR, imagen));
    } catch {
        // La imagen puede haber sido retirada previamente del disco.
    }
}

function validarProducto({ nombre, categoria, precio, stock }) {
    if (!String(nombre || '').trim()) {
        throw new AppError('El nombre del producto es obligatorio', 400);
    }
    if (!String(categoria || '').trim()) {
        throw new AppError('La categoría del producto es obligatoria', 400);
    }
    const precioNumero = Number(precio);
    if (!Number.isFinite(precioNumero) || precioNumero < 0) {
        throw new AppError('El precio debe ser un número igual o mayor que cero', 400);
    }
    const stockNumero = Number(stock);
    if (!Number.isInteger(stockNumero) || stockNumero < 0) {
        throw new AppError('Las existencias deben ser un número entero igual o mayor que cero', 400);
    }
    return { precioNumero, stockNumero };
}

async function listProductos() {
    const [rows] = await pool.execute(
        'SELECT * FROM productos WHERE activo = 1 ORDER BY id_producto DESC'
    );
    return agregarImagenes(rows);
}

async function listTodosProductos() {
    const [rows] = await pool.execute(
        'SELECT * FROM productos ORDER BY id_producto DESC'
    );
    return agregarImagenes(rows);
}

async function getProductoById(id) {
    const [rows] = await pool.execute(
        'SELECT * FROM productos WHERE id_producto = ? AND activo = 1',
        [id]
    );
    if (!rows.length) throw new AppError('Producto no encontrado', 404);
    return (await agregarImagenes(rows))[0];
}

async function createProducto(data, imagen, imagenes = []) {
    const { precioNumero, stockNumero } = validarProducto(data);
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.execute(
            `INSERT INTO productos
                (nombre, descripcion, categoria, marca, modelo, precio, stock, imagen)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                String(data.nombre).trim(),
                String(data.descripcion || '').trim() || null,
                String(data.categoria).trim(),
                String(data.marca || '').trim() || null,
                String(data.modelo || '').trim() || null,
                precioNumero,
                stockNumero,
                imagen || null
            ]
        );
        if (imagenes.length) {
            await connection.query(
                'INSERT INTO producto_imagenes (id_producto, archivo) VALUES ?',
                [imagenes.map((archivo) => [result.insertId, archivo.filename])]
            );
        }
        const [rows] = await connection.execute(
            'SELECT * FROM productos WHERE id_producto = ?',
            [result.insertId]
        );
        const [product] = await agregarImagenes(rows, connection);
        await connection.commit();
        return product;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function updateProducto(id, data, imagen, imagenes = [], eliminarImagenPrincipal = false, imagenesEliminar = []) {
    const { precioNumero, stockNumero } = validarProducto(data);
    const connection = await pool.getConnection();
    let imagenAnterior;
    let imagenesAdicionalesEliminadas = [];
    try {
        await connection.beginTransaction();
        const [actualRows] = await connection.execute(
            'SELECT imagen FROM productos WHERE id_producto = ? FOR UPDATE',
            [id]
        );
        if (!actualRows.length) throw new AppError('Producto no encontrado', 404);

        imagenAnterior = actualRows[0].imagen;
        await connection.execute(
            `UPDATE productos
             SET nombre = ?, descripcion = ?, categoria = ?, marca = ?, modelo = ?,
                 precio = ?, stock = ?, imagen = ?
             WHERE id_producto = ?`,
            [
                String(data.nombre).trim(),
                String(data.descripcion || '').trim() || null,
                String(data.categoria).trim(),
                String(data.marca || '').trim() || null,
                String(data.modelo || '').trim() || null,
                precioNumero,
                stockNumero,
                imagen || (eliminarImagenPrincipal ? null : imagenAnterior),
                id
            ]
        );
        if (imagenes.length) {
            await connection.query(
                'INSERT INTO producto_imagenes (id_producto, archivo) VALUES ?',
                [imagenes.map((archivo) => [id, archivo.filename])]
            );
        }
        const idsEliminar = [...new Set(imagenesEliminar.map(Number).filter((idImagen) => Number.isSafeInteger(idImagen) && idImagen > 0))];
        if (idsEliminar.length) {
            const placeholders = idsEliminar.map(() => '?').join(', ');
            const [actuales] = await connection.execute(
                `SELECT id_imagen, archivo FROM producto_imagenes
                 WHERE id_producto = ? AND id_imagen IN (${placeholders}) FOR UPDATE`,
                [id, ...idsEliminar]
            );
            imagenesAdicionalesEliminadas = actuales.map((image) => image.archivo);
            await connection.execute(
                `DELETE FROM producto_imagenes
                 WHERE id_producto = ? AND id_imagen IN (${placeholders})`,
                [id, ...idsEliminar]
            );
        }
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

    if ((imagen || eliminarImagenPrincipal) && imagenAnterior && imagenAnterior !== imagen) {
        await borrarImagenSiExiste(imagenAnterior);
    }
    await Promise.all(imagenesAdicionalesEliminadas.map(borrarImagenSiExiste));
}

async function setProductoActivo(id, activo) {
    if (typeof activo !== 'boolean') {
        throw new AppError('El estado activo debe ser verdadero o falso', 400);
    }
    const [result] = await pool.execute(
        'UPDATE productos SET activo = ? WHERE id_producto = ?',
        [activo ? 1 : 0, id]
    );
    if (!result.affectedRows) throw new AppError('Producto no encontrado', 404);
}

module.exports = {
    listProductos,
    listTodosProductos,
    getProductoById,
    createProducto,
    updateProducto,
    setProductoActivo,
    borrarImagenSiExiste
};
