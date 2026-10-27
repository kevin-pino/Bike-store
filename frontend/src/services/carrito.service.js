import { api } from './api';

export function getCarrito() {
    return api('/carrito');
}

export function agregarAlCarrito(idProducto, cantidad = 1) {
    return api('/carrito/items', {
        method: 'POST',
        body: JSON.stringify({ id_producto: idProducto, cantidad })
    });
}

export function actualizarCantidadCarrito(idProducto, cantidad) {
    return api(`/carrito/items/${idProducto}`, {
        method: 'PATCH',
        body: JSON.stringify({ cantidad })
    });
}

export function quitarDelCarrito(idProducto) {
    return api(`/carrito/items/${idProducto}`, { method: 'DELETE' });
}

export function finalizarCompra(datos) {
    return api('/pedidos/checkout', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}
