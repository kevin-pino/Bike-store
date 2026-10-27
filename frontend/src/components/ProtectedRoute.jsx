import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRouter({ roles = [] }) {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (roles.length && !roles.includes(user?.rol)) return <Navigate to="/catalogo" replace />;
    return <Outlet />;
}