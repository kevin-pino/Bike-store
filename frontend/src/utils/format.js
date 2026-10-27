import { SERVER_URL } from '../config/env';

export function urlImagen(nombreArchivo) {
    return nombreArchivo ? `${SERVER_URL}/uploads/productos/${nombreArchivo}` : null;
}

export function formatoPrecio(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(Number(valor) || 0);
}
