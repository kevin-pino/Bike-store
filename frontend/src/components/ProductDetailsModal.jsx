import { useEffect, useRef, useState } from 'react';
import { Check, ShoppingCart, X } from 'lucide-react';
import { formatoPrecio, urlImagen } from '../utils/format';

export default function ProductDetailsModal({ product, isCustomer, onClose, onAddToCart }) {
    const dialogRef = useRef(null);
    const feedbackTimer = useRef(null);
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (product && !dialog.open) dialog.showModal();
        if (!product && dialog.open) dialog.close();
    }, [product]);

    useEffect(() => () => clearTimeout(feedbackTimer.current), []);

    useEffect(() => {
        clearTimeout(feedbackTimer.current);
        setAdded(false);
        setAdding(false);
    }, [product?.id_producto]);

    if (!product) return null;

    async function addToCart() {
        if (adding) return;
        setAdding(true);
        const added = await onAddToCart(product);
        setAdding(false);
        if (added) {
            setAdded(true);
            clearTimeout(feedbackTimer.current);
            feedbackTimer.current = setTimeout(() => setAdded(false), 2400);
        }
    }

    return (
        <dialog
            ref={dialogRef}
            className="product-details-dialog"
            aria-labelledby="product-details-title"
            onClose={onClose}
            onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current.close(); }}
        >
            <header className="product-details-header">
                <div><p className="product-category">{product.categoria}</p><h2 id="product-details-title">{product.nombre}</h2></div>
                <button type="button" className="secondary product-dialog-close" onClick={() => dialogRef.current?.close()} aria-label="Cerrar detalles"><X size={18} /></button>
            </header>
            <div className="product-details-content">
                <div className="product-details-image">
                    {product.imagen && <img src={urlImagen(product.imagen)} alt={`${product.nombre}, imagen principal`} />}
                    {(product.imagenes || []).map((image, index) => (
                        <img key={image.id_imagen || image.archivo} src={urlImagen(image.archivo)} alt={`${product.nombre}, imagen adicional ${index + 1}`} />
                    ))}
                    {!product.imagen && !(product.imagenes || []).length && <span>Sin imagen disponible</span>}
                </div>
                <div className="product-details-info">
                    {(product.marca || product.modelo) && <p><strong>Marca y modelo:</strong> {[product.marca, product.modelo].filter(Boolean).join(' · ')}</p>}
                    <h3>Descripción</h3>
                    <p className="product-details-description">{product.descripcion || 'Este producto no tiene una descripción adicional.'}</p>
                    <p className="product-details-price">{formatoPrecio(product.precio)}</p>
                    <p>{product.stock > 0 ? `${product.stock} unidades disponibles` : 'Agotado'}</p>
                    {isCustomer && product.activo && product.stock > 0 && <button type="button" className={added ? 'product-added-success' : ''} onClick={addToCart} disabled={adding}>
                        {added ? <Check size={16} /> : <ShoppingCart size={16} />}{added ? 'Producto agregado' : adding ? 'Agregando...' : 'Agregar al carrito'}
                    </button>}
                </div>
            </div>
        </dialog>
    );
}
