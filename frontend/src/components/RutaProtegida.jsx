import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RutaProtegida({ admin = false }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="pantalla-carga">Cargando sesión…</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (admin && usuario.rol !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

