import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { actualizarCantidadCarrito, finalizarCompra, getCarrito, quitarDelCarrito } from '../services/carrito.service';
import { formatoPrecio, urlImagen } from '../utils/format';

const datosVacios = { direccion: '', ciudad: '', titularCuenta: '', referenciaCuenta: '' };

export default function CartPage() {
    const [carrito, setCarrito] = useState({ items: [], total: '0.00' });
    const [datos, setDatos] = useState(datosVacios);
    const [pedido, setPedido] = useState(null);
    const [productosComprados, setProductosComprados] = useState([]);
    const [productosSeleccionados, setProductosSeleccionados] = useState(null);
    const [checkoutStep, setCheckoutStep] = useState(false);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(false);

    const load = useCallback(async () => {
        try {
            setError('');
            const result = await getCarrito();
            setCarrito(result.data);
            setProductosSeleccionados((actuales) => actuales === null
                ? result.data.items.map((item) => item.id_producto)
                : actuales.filter((id) => result.data.items.some((item) => item.id_producto === id)));
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    async function changeQuantity(item, cantidad) {
        try {
            setError('');
            if (cantidad < 1) await quitarDelCarrito(item.id_producto);
            else await actualizarCantidadCarrito(item.id_producto, cantidad);
            await load();
        } catch (err) { setError(err.message); }
    }

    async function removeItem(idProducto) {
        try {
            setError('');
            await quitarDelCarrito(idProducto);
            await load();
        } catch (err) { setError(err.message); }
    }

    function change(event) {
        setDatos({ ...datos, [event.target.name]: event.target.value });
    }

    function toggleProduct(idProducto) {
        setProductosSeleccionados((actuales) => {
            const seleccion = new Set(actuales || carrito.items.map((item) => item.id_producto));
            if (seleccion.has(idProducto)) seleccion.delete(idProducto);
            else seleccion.add(idProducto);
            return [...seleccion];
        });
    }

    const seleccion = new Set(productosSeleccionados || carrito.items.map((item) => item.id_producto));
    const itemsSeleccionados = carrito.items.filter((item) => seleccion.has(item.id_producto));
    const totalSeleccionado = itemsSeleccionados.reduce((total, item) => total + Number(item.subtotal), 0);
    const cantidadSeleccionada = itemsSeleccionados.reduce((total, item) => total + Number(item.cantidad), 0);
    const seleccionValida = itemsSeleccionados.length > 0 && itemsSeleccionados.every((item) => item.activo && item.cantidad <= item.stock);

    async function submit(event) {
        event.preventDefault();
        setError('');
        setProcesando(true);
        try {
            const result = await finalizarCompra({ ...datos, productoIds: itemsSeleccionados.map((item) => item.id_producto) });
            setPedido(result.data);
            setProductosComprados(result.data.productos || itemsSeleccionados);
            setCheckoutStep(false);
            setDatos(datosVacios);
            await load();
        } catch (err) {
            setError(err.message);
        } finally {
            setProcesando(false);
        }
    }

    return (
        <>
            <Navbar />
            <main className="container">
                <header className="page-header"><h1>{checkoutStep ? 'Resumen de tu compra' : 'Tu carrito'}</h1><p>{checkoutStep ? 'Verifica los productos seleccionados y completa los datos de envío y pago.' : 'Selecciona lo que deseas comprar. Los demás productos seguirán guardados en tu carrito.'}</p></header>
                {error && <p className="error">{error}</p>}
                {pedido && (
                    <section className="card order-confirmation" role="status">
                        <h2>¡Pedido confirmado!</h2>
                        <p>Número de pedido: <strong>{pedido.numeroPedido}</strong></p>
                        <p>Total pagado de forma simulada: <strong>{formatoPrecio(pedido.total)}</strong></p>
                        <div className="checkout-order-lines">
                            {productosComprados.map((item) => <p key={item.id_producto}>{item.nombre} · {item.cantidad} × {formatoPrecio(item.precio)} c/u · Total: <strong>{formatoPrecio(item.subtotal)}</strong></p>)}
                        </div>
                        <p>{pedido.mensaje}. No se registraron datos de cuenta.</p>
                        <p><Link to="/mis-pedidos">Consultar mis pedidos</Link></p>
                        <button onClick={() => setPedido(null)}>Continuar comprando</button>
                    </section>
                )}
                {cargando ? <p>Cargando carrito...</p> : carrito.items.length === 0 ? (
                    <section className="card empty-state"><p>Tu carrito está vacío.</p><Link to="/catalogo">Volver al catálogo</Link></section>
                ) : (
                    <>
                        {!checkoutStep && <section className="cart-list" aria-label="Productos en el carrito">
                            {carrito.items.map((item) => (
                                <article className="card cart-item" key={item.id_producto}>
                                    <label className="cart-item-selection" aria-label={`Seleccionar ${item.nombre} para comprar`}>
                                        <input type="checkbox" checked={seleccion.has(item.id_producto)} onChange={() => toggleProduct(item.id_producto)} />
                                    </label>
                                    <div className="cart-item-image">{item.imagen && <img src={urlImagen(item.imagen)} alt={item.nombre} />}</div>
                                    <div className="cart-item-info">
                                        <h2>{item.nombre}</h2><p>{item.categoria}</p>
                                        <p>{formatoPrecio(item.precio)} cada uno · Subtotal: <strong>{formatoPrecio(item.subtotal)}</strong></p>
                                        {!item.activo && <p className="error">Este producto ya no está disponible.</p>}
                                        {item.cantidad > item.stock && <p className="error">Quedan {item.stock} unidades en inventario; ajusta la cantidad.</p>}
                                    </div>
                                    <div className="cart-item-controls">
                                        <div className="quantity-control">
                                            <button type="button" className="secondary" aria-label={`Disminuir ${item.nombre}`} onClick={() => changeQuantity(item, item.cantidad - 1)}><Minus size={16} /></button>
                                            <span>{item.cantidad}</span>
                                            <button type="button" className="secondary" aria-label={`Aumentar ${item.nombre}`} onClick={() => changeQuantity(item, item.cantidad + 1)} disabled={item.cantidad >= item.stock}><Plus size={16} /></button>
                                        </div>
                                        <button type="button" className="secondary" onClick={() => removeItem(item.id_producto)}><Trash2 size={16} />Quitar</button>
                                    </div>
                                </article>
                            ))}
                        </section>}
                        {!checkoutStep ? (
                            <section className="card checkout-selection-summary">
                                <div><h2>Productos seleccionados</h2><p>{cantidadSeleccionada} unidades · {itemsSeleccionados.length} productos</p><p className="cart-total">Total a pagar: {formatoPrecio(totalSeleccionado)}</p></div>
                                <button type="button" onClick={() => setCheckoutStep(true)} disabled={!seleccionValida}>Continuar con la compra</button>
                            </section>
                        ) : (
                            <section className="checkout-step">
                                <section className="card checkout-summary">
                                    <h2>Resumen del pedido</h2>
                                    <div className="checkout-order-lines">
                                        {itemsSeleccionados.map((item) => <article className="checkout-order-line" key={item.id_producto}>
                                            <div><strong>{item.nombre}</strong><span>{item.categoria}</span></div>
                                            <span>{item.cantidad} × {formatoPrecio(item.precio)} c/u</span>
                                            <strong>Total: {formatoPrecio(item.subtotal)}</strong>
                                        </article>)}
                                    </div>
                                    <p>Unidades: {cantidadSeleccionada}</p>
                                    <p className="cart-total">Total a pagar: {formatoPrecio(totalSeleccionado)}</p>
                                </section>
                                <form className="card form-grid checkout-form" onSubmit={submit}>
                                    <h2>Datos de envío y pago simulado</h2>
                                    <input name="direccion" placeholder="Dirección de envío" value={datos.direccion} onChange={change} required maxLength="250" />
                                    <input name="ciudad" placeholder="Ciudad" value={datos.ciudad} onChange={change} required maxLength="100" />
                                    <input name="titularCuenta" placeholder="Titular ficticio de la cuenta" value={datos.titularCuenta} onChange={change} required maxLength="100" />
                                    <input name="referenciaCuenta" placeholder="Referencia ficticia de cuenta" value={datos.referenciaCuenta} onChange={change} required maxLength="40" />
                                    <p className="simulation-note">Pago de práctica: usa datos ficticios. No ingreses números reales de cuenta, tarjeta ni claves.</p>
                                    <div className="actions checkout-actions"><button type="button" className="secondary" onClick={() => setCheckoutStep(false)}>Volver al carrito</button><button type="submit" disabled={procesando || !seleccionValida}>{procesando ? 'Procesando...' : 'Confirmar pago'}</button></div>
                                </form>
                            </section>
                        )}
                    </>
                )}
            </main>
        </>
    );
}
