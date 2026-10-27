import { api } from './api';
import { API_URL } from '../config/env';
import { getToken } from '../utils/storage';

function queryString(filters) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value);
    }
    return params.toString();
}

export function getDashboard(filters = {}) {
    const query = queryString(filters);
    return api(`/dashboard${query ? `?${query}` : ''}`);
}

export async function downloadDashboardCsv(filters = {}) {
    const query = queryString(filters);
    const response = await fetch(`${API_URL}/dashboard/exportar${query ? `?${query}` : ''}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'No fue posible exportar el informe');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = response.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/i)?.[1] || 'bikestore-informe.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function getUsuarios(busqueda = '') {
    const query = queryString({ busqueda });
    return api(`/usuarios${query ? `?${query}` : ''}`);
}

export function cambiarRol(id, rol) {
    return api(`/usuarios/${id}/rol`, { method: 'PATCH', body: JSON.stringify({ rol }) });
}

export function cambiarEstadoUsuario(id, activo) {
    return api(`/usuarios/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ activo }) });
}
