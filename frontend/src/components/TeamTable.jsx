import { Bike, Check, Pencil, Package, Power, ShoppingCart } from 'lucide-react';
import { formatoPrecio, urlImagen } from '../utils/format';
import ProductDetailsModal from './ProductDetailsModal';
import { useEffect, useRef, useState } from 'react';

export default function ProductGrid({ productos, canManage, isCustomer, canShop, onEdit, onSetActive, onAddToCart }) {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [addingProductId, setAddingProductId] = useState(null);
    const [addedProductId, setAddedProductId] = useState(null);
    const feedbackTimer = useRef(null);

    useEffect(() => () => clearTimeout(feedbackTimer.current), []);

    async function addToCart(producto) {
        if (addingProductId) return false;
        setAddingProductId(producto.id_producto);
        const added = await onAddToCart(producto);
        setAddingProductId(null);
        if (added) {
            setAddedProductId(producto.id_producto);
            clearTimeout(feedbackTimer.current);
            feedbackTimer.current = setTimeout(() => setAddedProductId(null), 2400);
        }
        return added;
    }

    if (!productos.length) {
        return <div className="card empty-state"><Package size={28} /><p>Aún no hay productos para mostrar.</p></div>;
    }

    return (
        <section className="equipos-section">
            <h2>Productos</h2>
            <div className="equipos-grid">
                {productos.map((producto) => {
                    const imagen = urlImagen(producto.imagen);
                    return (
                        <article className={`equipo-card ${producto.activo ? '' : 'product-inactive'}`} key={producto.id_producto}>
                            <button type="button" className="equipo-card-image product-image-button" onClick={() => setSelectedProduct(producto)} aria-label={`Ver detalles de ${producto.nombre}`}>
                                {imagen ? <img src={imagen} alt={producto.nombre} /> : <Bike size={34} />}
                            </button>
                            <div className="equipo-card-body">
                                <p className="product-category">{producto.categoria}</p>
                                <h3><button type="button" className="product-title-button" onClick={() => setSelectedProduct(producto)}>{producto.nombre}</button></h3>
                                {(producto.marca || producto.modelo) && <p className="equipo-card-meta">{[producto.marca, producto.modelo].filter(Boolean).join(' · ')}</p>}
                                {producto.descripcion && <p className="product-description product-description-clamp">{producto.descripcion}</p>}
                                <p className="product-price">{formatoPrecio(producto.precio)}</p>
                                <p className="product-stock">{producto.stock > 0 ? `${producto.stock} disponibles` : 'Agotado'}</p>
                                {!producto.activo && <span className="product-status">Inactivo</span>}
                            </div>
                            <div className="product-buy-actions">
                                <button type="button" className="secondary product-details-button" onClick={() => setSelectedProduct(producto)}>Ver detalles</button>
                                {canShop && producto.activo && producto.stock > 0 && (
                                    <button
                                        type="button"
                                        className={addedProductId === producto.id_producto ? 'product-added-success' : ''}
                                        onClick={() => addToCart(producto)}
                                        disabled={addingProductId === producto.id_producto}
                                    >
                                        {addedProductId === producto.id_producto ? <Check size={16} /> : <ShoppingCart size={16} />}
                                        {addedProductId === producto.id_producto ? 'Producto agregado' : addingProductId === producto.id_producto ? 'Agregando...' : isCustomer ? 'Agregar al carrito' : 'Iniciar sesión para comprar'}
                                    </button>
                                )}
                            </div>
                            {canManage && (
                                <div className="actions equipo-card-actions">
                                    <button className="edit" onClick={() => onEdit(producto)}><Pencil size={16} />Editar</button>
                                    <button className="secondary" onClick={() => onSetActive(producto)}><Power size={16} />{producto.activo ? 'Inactivar' : 'Activar'}</button>
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
            <ProductDetailsModal
                product={selectedProduct}
                isCustomer={isCustomer}
                onClose={() => setSelectedProduct(null)}
                onAddToCart={addToCart}
            />
        </section>
    );
}
