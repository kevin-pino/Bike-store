import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, LayoutGrid, Lock, Mail } from 'lucide-react';
import { requestPasswordReset, resetPassword } from '../services/auth.service';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [accountFound, setAccountFound] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function checkEmail(event) {
        event.preventDefault(); setError(''); setSubmitting(true);
        try {
            const result = await requestPasswordReset(email);
            if (!result.existe) { setError('No encontramos una cuenta activa con ese correo.'); return; }
            setAccountFound(true);
        } catch (err) { setError(err.message); }
        finally { setSubmitting(false); }
    }

    async function savePassword(event) {
        event.preventDefault(); setError('');
        if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return; }
        setSubmitting(true);
        try {
            await resetPassword({ email, password });
            setCompleted(true);
        } catch (err) { setError(err.message); }
        finally { setSubmitting(false); }
    }

    return <main className="auth-page"><section className="card auth-card">
        <div className="auth-logo"><LayoutGrid size={26} /></div><h1>BikeStore</h1><h2>Restablecer contraseña</h2>
        {error && <p className="error"><AlertCircle size={16} />{error}</p>}
        {completed ? <>
            <p className="success"><CheckCircle2 size={16} />La contraseña se actualizó. Ya puedes iniciar sesión.</p>
            <p><Link to="/login">Volver al inicio de sesión</Link></p>
        </> : accountFound ? <form onSubmit={savePassword}>
            <p>Cuenta encontrada para <strong>{email}</strong>. Escribe una nueva contraseña.</p>
            <div className="field"><Lock size={16} /><input type="password" placeholder="Nueva contraseña (mínimo 8 caracteres)" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={72} autoComplete="new-password" required /></div>
            <div className="field"><Lock size={16} /><input type="password" placeholder="Confirma la contraseña" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} maxLength={72} autoComplete="new-password" required /></div>
            <button type="submit" disabled={submitting}>{submitting ? 'Guardando...' : 'Actualizar contraseña'}</button>
        </form> : <form onSubmit={checkEmail}>
            <p>Ingresa el correo de tu cuenta. Si está registrado, podrás establecer una nueva contraseña.</p>
            <div className="field"><Mail size={16} /><input type="email" placeholder="Correo registrado" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div>
            <button type="submit" disabled={submitting}>{submitting ? 'Consultando...' : 'Consultar correo'}</button>
        </form>}
        {!completed && <p><Link to="/login">Volver al inicio de sesión</Link></p>}
    </section></main>;
}
