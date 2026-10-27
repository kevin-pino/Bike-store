const pool = require('../config/db');
const AppError = require('../utils/AppError');

function validarCantidad(cantidad) {
    const numero = Number(cantidad);
    if (!Number.isInteger(numero) || numero < 1) {
        throw new AppError('La cantidad debe ser un entero mayor que cero', 400);
    }
    return numero;
}

function validarIdProducto(idProducto) {
    const id = Number(idProducto);
    if (!Number.isInteger(id) || id < 1) throw new AppError('Identificador de producto inválido', 400);
    return id;
}

async function obtenerIdCarrito(connection, idUsuario) {
    await connection.execute(
        'INSERT INTO carritos (id_usuario) VALUES (?) ON DUPLICATE KEY UPDATE id_carrito = LAST_INSERT_ID(id_carrito)',
        [idUsuario]
    );
    const [rows] = await connection.execute(
        'SELECT id_carrito FROM carritos WHERE id_usuario = ?',
        [idUsuario]
    );
    return rows[0].id_carrito;
}

async function getCarrito(idUsuario) {
    const connection = await pool.getConnection();
    try {
        const idCarrito = await obtenerIdCarrito(connection, idUsuario);
        const [rows] = await connection.execute(
            `SELECT p.id_producto, p.nombre, p.categoria, p.precio, p.imagen,
                    p.stock, p.activo, cd.cantidad
             FROM carrito_detalles cd
             JOIN productos p ON p.id_producto = cd.id_producto
             WHERE cd.id_carrito = ?
             ORDER BY p.nombre`,
            [idCarrito]
        );
        let totalCentavos = 0;
        const items = rows.map((item) => {
            const precioCentavos = Math.round(Number(item.precio) * 100);
            const subtotalCentavos = precioCentavos * item.cantidad;
            totalCentavos += subtotalCentavos;
            return {
                ...item,
                precio: (precioCentavos / 100).toFixed(2),
                subtotal: (subtotalCentavos / 100).toFixed(2)
            };
        });
        return { items, total: (totalCentavos / 100).toFixed(2) };
    } finally {
        connection.release();
    }
}

async function agregarProducto(idUsuario, idProducto, cantidad) {
    idProducto = validarIdProducto(idProducto);
    const cantidadNueva = validarCantidad(cantidad);
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const idCarrito = await obtenerIdCarrito(connection, idUsuario);
        const [productos] = await connection.execute(
            'SELECT stock FROM productos WHERE id_producto = ? AND activo = 1 FOR UPDATE',
            [idProducto]
        );
        if (!productos.length) throw new AppError('Producto no disponible', 404);

        const [items] = await connection.execute(
            'SELECT cantidad FROM carrito_detalles WHERE id_carrito = ? AND id_producto = ? FOR UPDATE',
            [idCarrito, idProducto]
        );
        const totalSolicitado = cantidadNueva + (items[0]?.cantidad || 0);
        if (totalSolicitado > productos[0].stock) {
            throw new AppError('La cantidad solicitada supera las existencias disponibles', 409);
        }
        await connection.execute(
            `INSERT INTO carrito_detalles (id_carrito, id_producto, cantidad)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE cantidad = VALUES(cantidad)`,
            [idCarrito, idProducto, totalSolicitado]
        );
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function actualizarCantidad(idUsuario, idProducto, cantidad) {
    idProducto = validarIdProducto(idProducto);
    const nuevaCantidad = validarCantidad(cantidad);
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const idCarrito = await obtenerIdCarrito(connection, idUsuario);
        const [productos] = await connection.execute(
            'SELECT stock, activo FROM productos WHERE id_producto = ? FOR UPDATE',
            [idProducto]
        );
        if (!productos.length || !productos[0].activo) throw new AppError('Producto no disponible', 404);
        if (nuevaCantidad > productos[0].stock) {
            throw new AppError('La cantidad solicitada supera las existencias disponibles', 409);
        }
        const [result] = await connection.execute(
            'UPDATE carrito_detalles SET cantidad = ? WHERE id_carrito = ? AND id_producto = ?',
            [nuevaCantidad, idCarrito, idProducto]
        );
        if (!result.affectedRows) throw new AppError('El producto no está en el carrito', 404);
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function quitarProducto(idUsuario, idProducto) {
    idProducto = validarIdProducto(idProducto);
    const connection = await pool.getConnection();
    try {
        const idCarrito = await obtenerIdCarrito(connection, idUsuario);
        const [result] = await connection.execute(
            'DELETE FROM carrito_detalles WHERE id_carrito = ? AND id_producto = ?',
            [idCarrito, idProducto]
        );
        if (!result.affectedRows) throw new AppError('El producto no está en el carrito', 404);
    } finally {
        connection.release();
    }
}

module.exports = { getCarrito, agregarProducto, actualizarCantidad, quitarProducto, obtenerIdCarrito };
