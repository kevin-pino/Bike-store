import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, PackageCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import { getMisPedidos } from '../services/pedidos.service';
import { formatoPrecio } from '../utils/format';

function fechaPedido(value) {
    const fecha = new Date(value);
    return Number.isNaN(fecha.getTime()) ? 'Fecha no disponible' : fecha.toLocaleString('es-CO');
}

export default function OrdersPage() {
    const [pedidos, setPedidos] = useState([]);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);

    const load = useCallback(async () => {
        setError('');
        try {
            const result = await getMisPedidos();
            setPedidos(result.data || []);
        } catch (err) { setError(err.message); }
        finally { setCargando(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    return <>
        <Navbar />
        <main className="container">
            <header className="page-header"><h1>Mis pedidos</h1><p>Consulta tus compras y números de confirmación.</p></header>
            {error && <p className="error">{error}</p>}
            {cargando ? <p>Cargando pedidos...</p> : pedidos.length === 0 ? (
                <section className="card empty-state"><ClipboardList size={32} /><p>Aún no tienes pedidos.</p><Link to="/catalogo">Explorar el catálogo</Link></section>
            ) : <section className="orders-list" aria-label="Historial de pedidos">
                {pedidos.map((pedido) => <article className="card order-card" key={pedido.id_pedido}>
                    <header className="order-card-header">
                        <div><p className="order-label">Número de pedido</p><h2>{pedido.numero_pedido}</h2><p>{fechaPedido(pedido.created_at)}</p></div>
                        <span className={`order-status ${pedido.estado === 'pagado_simulado' ? 'order-status-paid' : ''}`}><PackageCheck size={16} />{pedido.estado === 'pagado_simulado' ? 'Pago simulado confirmado' : pedido.estado}</span>
                    </header>
                    <div className="order-products">
                        {pedido.productos.map((producto) => <div className="order-product" key={`${pedido.id_pedido}-${producto.id_producto}`}>
                            <span>{producto.nombre} × {producto.cantidad}</span>
                            <span>{formatoPrecio(producto.subtotal)}</span>
                        </div>)}
                    </div>
                    <div className="order-card-footer"><span>Envío: {pedido.direccion_envio}, {pedido.ciudad}</span><strong>Total: {formatoPrecio(pedido.total)}</strong></div>
                </article>)}
            </section>}
        </main>
    </>;
}
