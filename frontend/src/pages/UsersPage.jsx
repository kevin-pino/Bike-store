import { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { cambiarEstadoUsuario, cambiarRol, getUsuarios } from '../services/administracion.service';
import { useAuth } from '../hooks/useAuth';

export default function UsersPage() {
    const { user: usuarioActual } = useAuth();
    const [busqueda, setBusqueda] = useState('');
    const [usuarios, setUsuarios] = useState([]);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);

    const load = useCallback(async () => {
        setCargando(true);
        try {
            setError('');
            const result = await getUsuarios(busqueda);
            setUsuarios(result.data);
        } catch (err) { setError(err.message); }
        finally { setCargando(false); }
    }, [busqueda]);

    useEffect(() => { load(); }, [load]);

    async function changeRole(usuario, rol) {
        try {
            setError('');
            await cambiarRol(usuario.id_usuario, rol);
            await load();
        } catch (err) { setError(err.message); }
    }

    async function changeActive(usuario) {
        try {
            setError('');
            await cambiarEstadoUsuario(usuario.id_usuario, !usuario.activo);
            await load();
        } catch (err) { setError(err.message); }
    }

    return (
        <>
            <Navbar />
            <main className="container">
                <header className="page-header"><h1>Gestión de usuarios</h1><p>Busca cuentas y administra sus roles y estado.</p></header>
                {error && <p className="error">{error}</p>}
                <section className="card user-search"><label htmlFor="user-search">Buscar usuario por nombre o correo</label><input id="user-search" type="search" placeholder="Escribe un nombre o correo" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} /></section>
                <section className="card report-table">
                    {cargando ? <p>Cargando usuarios...</p> : usuarios.length ? (
                        <table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
                            {usuarios.map((usuario) => {
                                const isSelf = usuario.id_usuario === usuarioActual?.id_usuario;
                                return <tr key={usuario.id_usuario}>
                                    <td>{usuario.nombre}{isSelf ? ' (tu cuenta)' : ''}</td><td>{usuario.email}</td>
                                    <td><select aria-label={`Rol de ${usuario.nombre}`} value={usuario.rol} onChange={(event) => changeRole(usuario, event.target.value)} disabled={isSelf}><option value="cliente">Cliente</option><option value="admin">Administrador</option></select></td>
                                    <td>{usuario.activo ? 'Activa' : 'Inactiva'}</td>
                                    <td><button type="button" className="secondary" onClick={() => changeActive(usuario)} disabled={isSelf}>{usuario.activo ? 'Desactivar' : 'Activar'}</button></td>
                                </tr>;
                            })}
                        </tbody></table>
                    ) : <p>No se encontraron usuarios.</p>}
                </section>
            </main>
        </>
    );
}
