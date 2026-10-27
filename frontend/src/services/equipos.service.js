import { api } from './api';

function toFormData(data) {
    const formData = new FormData();
    for (const field of ['nombre', 'descripcion', 'categoria', 'marca', 'modelo', 'precio', 'stock']) {
        formData.append(field, data[field] ?? '');
    }
    if (data.imagenFile) formData.append('imagen', data.imagenFile);
    for (const imagen of data.imagenesFiles || []) formData.append('imagenes', imagen);
    formData.append('eliminarImagenPrincipal', String(Boolean(data.eliminarImagenPrincipal)));
    for (const idImagen of data.imagenesEliminar || []) formData.append('imagenesEliminar', String(idImagen));
    return formData;
}

export function getProductos() {
    return api('/productos');
}

export function getProductosAdmin() {
    return api('/productos/admin/all');
}

export function createProducto(data) {
    return api('/productos', { method: 'POST', body: toFormData(data) });
}

export function updateProducto(id, data) {
    return api(`/productos/${id}`, { method: 'PUT', body: toFormData(data) });
}

export function setProductoActivo(id, activo) {
    return api(`/productos/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ activo })
    });
}
