import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import CrudPage from './components/CrudPage.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Inicio from './pages/Inicio.jsx';
import Login from './pages/Login.jsx';
import Perfil from './pages/Perfil.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RutaProtegida />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<Inicio />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="catalogo/:entidad" element={<CrudPage />} />
              <Route element={<RutaProtegida admin />}>
                <Route path="catalogo/usuarios" element={<CrudPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Login />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
