import { useState } from 'react';
import { api } from '../api.js';
import Avatar from '../components/Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Perfil() {
  const { usuario, recargar } = useAuth();
  const [passwords, setPasswords] = useState({ actual: '', nueva: '' });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  async function subirFoto(evento) {
    const archivo = evento.target.files[0];
    if (!archivo) return;
    const datos = new FormData();
    datos.append('foto', archivo);
    try {
      setError('');
      await api('/auth/me/foto', { method: 'PUT', body: datos });
      await recargar();
      setMensaje('Foto actualizada');
    } catch (e) {
      setError(e.message);
    }
  }

  async function cambiarPassword(evento) {
    evento.preventDefault();
    try {
      setError('');
      await api('/auth/me/password', { method: 'PUT', body: passwords });
      setPasswords({ actual: '', nueva: '' });
      setMensaje('Contraseña actualizada');
    } catch (e) {
      setError(e.detalles?.map((d) => d.mensaje).join(' · ') || e.message);
    }
  }

  return (
    <section>
      <div className="encabezado-pagina"><div><p className="eyebrow">Cuenta</p><h1>Mi perfil</h1><p>Actualiza tu foto y protege tu acceso.</p></div></div>
      {error && <div className="alert alert-danger">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      <div className="perfil-grid">
        <article className="panel perfil-datos">
          <Avatar usuario={usuario} grande />
          <div><h2>{usuario.nombre}</h2><p>@{usuario.username}</p><p>{usuario.correo || 'Sin correo'}</p><span className="rol">{usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}</span></div>
          <label className="btn btn-outline-primary">Cambiar foto<input className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={subirFoto} /></label>
          <small>JPG, PNG o WebP. Máximo 2 MB.</small>
        </article>
        <form className="panel" onSubmit={cambiarPassword}>
          <h2>Cambiar contraseña</h2>
          <p className="text-secondary">Usa al menos 10 caracteres, mayúscula, minúscula, número y símbolo.</p>
          <label className="form-label w-100">Contraseña actual
            <input className="form-control mt-1" type="password" required value={passwords.actual} onChange={(e) => setPasswords({ ...passwords, actual: e.target.value })} />
          </label>
          <label className="form-label w-100 mt-3">Nueva contraseña
            <input className="form-control mt-1" type="password" required value={passwords.nueva} onChange={(e) => setPasswords({ ...passwords, nueva: e.target.value })} />
          </label>
          <button className="btn btn-primary mt-4">Actualizar contraseña</button>
        </form>
      </div>
    </section>
  );
}

