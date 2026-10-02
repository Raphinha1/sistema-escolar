import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { usuario, cargando, login } = useAuth();
  const navegar = useNavigate();
  const [credenciales, setCredenciales] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (!cargando && usuario) return <Navigate to="/" replace />;

  async function enviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await login(credenciales);
      navegar('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="login-fondo">
      <section className="login-card">
        <div className="login-identidad"><span>SE</span></div>
        <p className="eyebrow">Control académico</p>
        <h1>Bienvenido</h1>
        <p className="login-intro">Ingresa tus credenciales para administrar la información escolar.</p>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={enviar}>
          <label className="form-label w-100">Usuario
            <input className="form-control mt-1" autoComplete="username" required value={credenciales.username}
              onChange={(e) => setCredenciales({ ...credenciales, username: e.target.value })} />
          </label>
          <label className="form-label w-100 mt-3">Contraseña
            <input className="form-control mt-1" type="password" autoComplete="current-password" required value={credenciales.password}
              onChange={(e) => setCredenciales({ ...credenciales, password: e.target.value })} />
          </label>
          <button className="btn btn-primary w-100 mt-4" disabled={enviando}>{enviando ? 'Ingresando…' : 'Iniciar sesión'}</button>
        </form>
      </section>
    </main>
  );
}

