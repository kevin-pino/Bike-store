import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductCatalogPage from './pages/EquiposPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UsersPage from './pages/UsersPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import './assets/styles.css';

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/registro" element={<RegisterPage />} />
                    <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
                    <Route path="/catalogo" element={<ProductCatalogPage />} />
                    <Route element={<ProtectedRoute roles={['admin']} />}><Route path="/admin/dashboard" element={<AdminDashboardPage />} /><Route path="/admin/usuarios" element={<UsersPage />} /></Route>
                    <Route element={<ProtectedRoute roles={['cliente']} />}>
                        <Route path="/carrito" element={<CartPage />} />
                        <Route path="/mis-pedidos" element={<OrdersPage />} />
                    </Route>
                    <Route path="/" element={<Navigate to="/catalogo" replace />} />
                    <Route path="*" element={<Navigate to="/catalogo" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}