import { api } from './api';

export function getMisPedidos() {
    return api('/pedidos');
}
