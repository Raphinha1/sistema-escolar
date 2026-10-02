import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const enlaces = [
  ['/', 'Inicio'], ['/catalogo/alumnos', 'Alumnos'], ['/catalogo/maestros', 'Maestros'],
  ['/catalogo/materias', 'Materias'], ['/catalogo/grupos', 'Grupos'], ['/perfil', 'Mi perfil'],
];

export default function DashboardLayout() {
  const { usuario, logout } = useAuth();
  const navegar = useNavigate();

  async function salir() {
    await logout();
    navegar('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="marca"><span>SE</span><strong>Sistema escolar</strong></div>
        <div className="perfil-sidebar">
          <Avatar usuario={usuario} />
          <div><strong>{usuario.nombre}</strong><span>@{usuario.username}</span><span>{usuario.correo || 'Sin correo'}</span></div>
          <span className="rol">{usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}</span>
        </div>
        <nav>
          {enlaces.map(([ruta, texto]) => <NavLink key={ruta} to={ruta} end={ruta === '/'}>{texto}</NavLink>)}
          {usuario.rol === 'admin' && <NavLink to="/catalogo/usuarios">Usuarios</NavLink>}
        </nav>
        <button className="salir" onClick={salir}>Cerrar sesión</button>
      </aside>
      <main className="contenido"><Outlet /></main>
    </div>
  );
}
