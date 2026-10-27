import { Link } from 'react-router-dom';
import { BarChart3, ClipboardList, LayoutGrid, LogIn, LogOut, ShoppingCart, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="navbar">
            <Link to="/catalogo" className="brand"><LayoutGrid size={22} />BikeStore</Link>
            <div className="nav-right">
                {user ? (
                    <>
                        {user.rol === 'admin' && <><Link to="/admin/dashboard" className="nav-link"><BarChart3 size={16} />Dashboard</Link><Link to="/admin/usuarios" className="nav-link"><Users size={16} />Usuarios</Link></>}
                        {user.rol === 'cliente' && <><Link to="/mis-pedidos" className="nav-link"><ClipboardList size={16} />Mis pedidos</Link><Link to="/carrito" className="nav-link"><ShoppingCart size={16} />Mi carrito</Link></>}
                        <span>{user.nombre} · <strong>{user.rol}</strong></span>
                        <button className="secondary" onClick={logout}><LogOut size={16} />Cerrar sesión</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-link"><LogIn size={16} />Iniciar sesión</Link>
                        <Link to="/registro" className="nav-link"><UserPlus size={16} />Registrarme</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
