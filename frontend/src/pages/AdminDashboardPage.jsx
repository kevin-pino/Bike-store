import { useCallback, useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { getDashboard, downloadDashboardCsv } from '../services/administracion.service';
import { getProductosAdmin } from '../services/equipos.service';
import { formatoPrecio } from '../utils/format';

const filtrosVacios = { desde: '', hasta: '', categoria: '' };

export default function AdminDashboardPage() {
    const [filtrosFormulario, setFiltrosFormulario] = useState(filtrosVacios);
    const [filtros, setFiltros] = useState(filtrosVacios);
    const [informe, setInforme] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);

    const load = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            const [dashboard, productos] = await Promise.all([getDashboard(filtros), getProductosAdmin()]);
            setInforme(dashboard.data);
            setCategorias([...new Set(productos.data.map((item) => item.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b)));
        } catch (err) { setError(err.message); }
        finally { setCargando(false); }
    }, [filtros]);

    useEffect(() => { load(); }, [load]);

    function change(event) {
        setFiltrosFormulario({ ...filtrosFormulario, [event.target.name]: event.target.value });
    }

    function applyFilters(event) {
        event.preventDefault();
        setFiltros(filtrosFormulario);
    }

    async function exportCsv() {
        try {
            setError('');
            await downloadDashboardCsv(filtros);
        } catch (err) { setError(err.message); }
    }

    const metricas = useMemo(() => informe ? [
        ['Ventas totales', formatoPrecio(informe.totalVentas)],
        ['Cantidad de pedidos', informe.cantidadPedidos],
        ['Clientes activos', informe.clientesActivos]
    ] : [], [informe]);

    return (
        <>
            <Navbar />
            <main className="container admin-report-page">
                <header className="page-header"><h1>Dashboard comercial</h1><p>Indicadores de BikeStore para el periodo seleccionado.</p></header>
                {error && <p className="error">{error}</p>}
                <form className="card report-filters no-print" onSubmit={applyFilters}>
                    <label>Desde<input type="date" name="desde" value={filtrosFormulario.desde} onChange={change} /></label>
                    <label>Hasta<input type="date" name="hasta" value={filtrosFormulario.hasta} onChange={change} /></label>
                    <label>Categoría<select name="categoria" value={filtrosFormulario.categoria} onChange={change}><option value="">Todas</option>{categorias.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                    <div className="actions"><button type="submit">Aplicar filtros</button><button type="button" className="secondary" onClick={exportCsv}>Exportar para Excel</button><button type="button" className="secondary" onClick={() => window.print()}>Imprimir / Guardar PDF</button></div>
                </form>
                {cargando ? <p>Cargando indicadores...</p> : informe && (
                    <>
                        <section className="metric-grid">
                            {metricas.map(([label, value]) => <article className="card metric-card" key={label}><p>{label}</p><strong>{value}</strong></article>)}
                        </section>
                        <section className="card report-table">
                            <h2>Productos más vendidos</h2>
                            {informe.productosMasVendidos.length ? (
                                <table><thead><tr><th>Producto</th><th>Unidades vendidas</th><th>Ventas</th></tr></thead><tbody>
                                    {informe.productosMasVendidos.map((producto) => <tr key={producto.id_producto}><td>{producto.nombre_producto}</td><td>{producto.unidadesVendidas}</td><td>{formatoPrecio(producto.ventas)}</td></tr>)}
                                </tbody></table>
                            ) : <p>Aún no hay ventas para los filtros seleccionados.</p>}
                        </section>
                    </>
                )}
            </main>
        </>
    );
}
