import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, LayoutGrid, Lock, UserPlus } from 'lucide-react';
import { register } from '../services/auth.service';

const formatoEmail = /^[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,63}$/i;

function correoValido(email) {
    const parteLocal = email.split('@')[0];
    return email.length <= 150 && parteLocal.length <= 64 && formatoEmail.test(email);
}

export default function RegisterPage() {
    const [form, setForm] = useState({ nombre: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [created, setCreated] = useState(false);

    function change(event) {
        setForm({ ...form, [event.target.name]: event.target.value });
    }

    async function submit(event) {
        event.preventDefault();
        setError('');
        const email = form.email.trim().toLowerCase();
        if (!correoValido(email)) {
            setError('Escribe un correo completo y válido, por ejemplo nombre@dominio.com.');
            return;
        }
        try {
            await register({ ...form, email });
            setCreated(true);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <main className="auth-page">
            <form className="card auth-card" onSubmit={submit}>
                <div className="auth-logo"><LayoutGrid size={26} /></div>
                <h1>BikeStore</h1>
                <h2>Crear cuenta de cliente</h2>
                {error && <p className="error"><AlertCircle size={16} />{error}</p>}
                {created ? <>
                    <p className="success"><CheckCircle2 size={16} />Cuenta creada. Ya puedes iniciar sesión con el correo y la contraseña registrados.</p>
                    <p><Link to="/login">Volver al inicio de sesión</Link></p>
                </> : <>
                <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={change} required />
                <input name="email" type="email" placeholder="Correo (ej. nombre@dominio.com)" value={form.email} onChange={change} autoComplete="email" maxLength={150} required />
                <div className="field">
                    <Lock size={16} />
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Contraseña (mínimo 8 caracteres)" value={form.password} onChange={change} autoComplete="new-password" className="has-toggle" minLength={8} maxLength={72} required />
                    <button type="button" className="toggle-visibility" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                <button type="submit"><UserPlus size={16} />Registrarme</button>
                <p>¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link></p>
                </>}
            </form>
        </main>
    );
}
