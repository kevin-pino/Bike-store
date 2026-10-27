const pool = require('../config/db');
const AppError = require('../utils/AppError');

function validateDate(value, field) {
    if (!value) return '';
    if (typeof value !== 'string') throw new AppError(`La fecha ${field} debe ser un solo valor`, 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new AppError(`La fecha ${field} debe usar formato AAAA-MM-DD`, 400);
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        throw new AppError(`La fecha ${field} no es válida`, 400);
    }
    return value;
}

function buildFilters({ desde, hasta, categoria }) {
    const start = validateDate(desde, 'inicial');
    const end = validateDate(hasta, 'final');
    if (start && end && start > end) throw new AppError('La fecha inicial no puede ser posterior a la final', 400);
    const category = String(categoria || '').trim().slice(0, 100);
    const conditions = ["pe.estado = 'pagado_simulado'"];
    const values = [];
    if (start) { conditions.push('pe.created_at >= ?'); values.push(`${start} 00:00:00`); }
    if (end) { conditions.push('pe.created_at < DATE_ADD(?, INTERVAL 1 DAY)'); values.push(`${end} 00:00:00`); }
    if (category) { conditions.push('pr.categoria = ?'); values.push(category); }
    return { where: conditions.join(' AND '), values };
}

async function getDashboard(filters = {}) {
    const { where, values } = buildFilters(filters);
    const [metricRows] = await pool.execute(
        `SELECT COALESCE(SUM(dp.subtotal), 0) AS totalVentas,
                COUNT(DISTINCT pe.id_pedido) AS cantidadPedidos
         FROM pedidos pe
         JOIN detalles_pedido dp ON dp.id_pedido = pe.id_pedido
         JOIN productos pr ON pr.id_producto = dp.id_producto
         WHERE ${where}`,
        values
    );
    const [topProducts] = await pool.execute(
        `SELECT dp.id_producto, dp.nombre_producto,
                SUM(dp.cantidad) AS unidadesVendidas, SUM(dp.subtotal) AS ventas
         FROM detalles_pedido dp
         JOIN pedidos pe ON pe.id_pedido = dp.id_pedido
         JOIN productos pr ON pr.id_producto = dp.id_producto
         WHERE ${where}
         GROUP BY dp.id_producto, dp.nombre_producto
         ORDER BY unidadesVendidas DESC, ventas DESC
         LIMIT 5`,
        values
    );
    const [[{ clientesActivos }]] = await pool.execute(
        "SELECT COUNT(*) AS clientesActivos FROM usuarios WHERE rol = 'cliente' AND activo = 1"
    );
    return {
        totalVentas: Number(metricRows[0].totalVentas).toFixed(2),
        cantidadPedidos: Number(metricRows[0].cantidadPedidos),
        clientesActivos: Number(clientesActivos),
        productosMasVendidos: topProducts.map((item) => ({
            ...item,
            unidadesVendidas: Number(item.unidadesVendidas),
            ventas: Number(item.ventas).toFixed(2)
        }))
    };
}

module.exports = { getDashboard };
