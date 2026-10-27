const crypto = require('crypto');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { obtenerIdCarrito } = require('./carrito.service');

function validarCheckout({ direccion, ciudad, titularCuenta, referenciaCuenta, productoIds } = {}) {
    const valores = { direccion, ciudad, titularCuenta, referenciaCuenta };
    for (const [campo, valor] of Object.entries(valores)) {
        if (typeof valor !== 'string' || !valor.trim()) {
            throw new AppError(`El campo ${campo} es obligatorio`, 400);
        }
    }
    if (direccion.trim().length > 250 || ciudad.trim().length > 100 ||
        titularCuenta.trim().length > 100 || referenciaCuenta.trim().length > 40) {
        throw new AppError('Uno de los datos excede la longitud permitida', 400);
    }
    if (!Array.isArray(productoIds) || !productoIds.length ||
        productoIds.some((id) => !Number.isSafeInteger(Number(id)) || Number(id) < 1)) {
        throw new AppError('Selecciona al menos un producto para comprar', 400);
    }
    const idsUnicos = [...new Set(productoIds.map(Number))];
    if (idsUnicos.length !== productoIds.length) throw new AppError('La selección contiene productos repetidos', 400);
    return idsUnicos;
}

async function finalizarCompra(idUsuario, datos) {
    const productoIds = validarCheckout(datos);
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const idCarrito = await obtenerIdCarrito(connection, idUsuario);
        const placeholders = productoIds.map(() => '?').join(', ');
        const [items] = await connection.execute(
            `SELECT p.id_producto, p.nombre, p.precio, p.stock, p.activo, cd.cantidad
             FROM carrito_detalles cd
             JOIN productos p ON p.id_producto = cd.id_producto
             WHERE cd.id_carrito = ? AND p.id_producto IN (${placeholders})
             FOR UPDATE`,
            [idCarrito, ...productoIds]
        );
        if (!items.length) throw new AppError('No hay productos seleccionados en tu carrito', 400);
        if (items.length !== productoIds.length) {
            throw new AppError('Uno o más productos seleccionados ya no están en tu carrito', 409);
        }

        let totalCentavos = 0;
        const lineas = items.map((item) => {
            if (!item.activo) throw new AppError(`El producto ${item.nombre} ya no está disponible`, 409);
            if (item.cantidad > item.stock) throw new AppError(`No hay existencias suficientes de ${item.nombre}`, 409);
            const precioCentavos = Math.round(Number(item.precio) * 100);
            const subtotalCentavos = precioCentavos * item.cantidad;
            totalCentavos += subtotalCentavos;
            return { ...item, precioCentavos, subtotalCentavos };
        });

        const numeroPedido = `BS-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const total = (totalCentavos / 100).toFixed(2);
        const [pedido] = await connection.execute(
            `INSERT INTO pedidos (numero_pedido, id_usuario, estado, total, direccion_envio, ciudad, metodo_pago)
             VALUES (?, ?, 'pagado_simulado', ?, ?, ?, 'PAGO_SIMULADO')`,
            [numeroPedido, idUsuario, total, datos.direccion.trim(), datos.ciudad.trim()]
        );

        for (const item of lineas) {
            await connection.execute(
                `INSERT INTO detalles_pedido
                    (id_pedido, id_producto, nombre_producto, precio_unitario, cantidad, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [pedido.insertId, item.id_producto, item.nombre, (item.precioCentavos / 100).toFixed(2), item.cantidad, (item.subtotalCentavos / 100).toFixed(2)]
            );
            const [result] = await connection.execute(
                'UPDATE productos SET stock = stock - ? WHERE id_producto = ? AND activo = 1 AND stock >= ?',
                [item.cantidad, item.id_producto, item.cantidad]
            );
            if (!result.affectedRows) throw new AppError(`No hay existencias suficientes de ${item.nombre}`, 409);
        }

        await connection.execute(
            `DELETE FROM carrito_detalles WHERE id_carrito = ? AND id_producto IN (${placeholders})`,
            [idCarrito, ...productoIds]
        );
        await connection.commit();
        return {
            numeroPedido,
            estado: 'pagado_simulado',
            total,
            mensaje: 'Pago simulado procesado correctamente',
            productos: lineas.map((item) => ({
                id_producto: item.id_producto,
                nombre: item.nombre,
                precio: (item.precioCentavos / 100).toFixed(2),
                cantidad: item.cantidad,
                subtotal: (item.subtotalCentavos / 100).toFixed(2)
            }))
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function getMisPedidos(idUsuario) {
    const [rows] = await pool.execute(
        `SELECT pe.id_pedido, pe.numero_pedido, pe.estado, pe.total,
                pe.direccion_envio, pe.ciudad, pe.created_at,
                dp.id_detalle, dp.id_producto, dp.nombre_producto,
                dp.precio_unitario, dp.cantidad, dp.subtotal
         FROM pedidos pe
         LEFT JOIN detalles_pedido dp ON dp.id_pedido = pe.id_pedido
         WHERE pe.id_usuario = ?
         ORDER BY pe.created_at DESC, dp.id_detalle ASC`,
        [idUsuario]
    );

    const pedidos = new Map();
    for (const row of rows) {
        let pedido = pedidos.get(row.id_pedido);
        if (!pedido) {
            pedido = {
                id_pedido: row.id_pedido,
                numero_pedido: row.numero_pedido,
                estado: row.estado,
                total: Number(row.total).toFixed(2),
                direccion_envio: row.direccion_envio,
                ciudad: row.ciudad,
                created_at: row.created_at,
                productos: []
            };
            pedidos.set(row.id_pedido, pedido);
        }
        if (row.id_detalle !== null) {
            pedido.productos.push({
                id_producto: row.id_producto,
                nombre: row.nombre_producto,
                precio_unitario: Number(row.precio_unitario).toFixed(2),
                cantidad: Number(row.cantidad),
                subtotal: Number(row.subtotal).toFixed(2)
            });
        }
    }
    return [...pedidos.values()];
}

module.exports = { finalizarCompra, getMisPedidos };
