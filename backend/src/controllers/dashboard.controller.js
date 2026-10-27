const dashboardService = require('../services/dashboard.service');

async function get(req, res, next) {
    try {
        res.json({ ok: true, data: await dashboardService.getDashboard(req.query) });
    } catch (error) { next(error); }
}

function csvValue(value) {
    const text = String(value ?? '');
    return `"${text.replaceAll('"', '""')}"`;
}

async function exportCsv(req, res, next) {
    try {
        const report = await dashboardService.getDashboard(req.query);
        const rows = [
            ['Tipo', 'Indicador o producto', 'Valor', 'Unidades'],
            ['Métrica', 'Ventas totales', report.totalVentas, ''],
            ['Métrica', 'Cantidad de pedidos', report.cantidadPedidos, ''],
            ['Métrica', 'Clientes activos', report.clientesActivos, ''],
            ...report.productosMasVendidos.map((item) => ['Producto más vendido', item.nombre_producto, item.ventas, item.unidadesVendidas])
        ];
        const csv = `\uFEFF${rows.map((row) => row.map(csvValue).join(';')).join('\r\n')}`;
        const date = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="bikestore-informe-${date}.csv"`);
        res.send(csv);
    } catch (error) { next(error); }
}

module.exports = { get, exportCsv };
