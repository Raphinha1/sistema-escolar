import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api('/auth/me')
      .then((respuesta) => setUsuario(respuesta.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  const valor = useMemo(() => ({
    usuario,
    cargando,
    async login(credenciales) {
      const respuesta = await api('/auth/login', { method: 'POST', body: credenciales });
      setUsuario(respuesta.usuario);
    },
    async logout() {
      await api('/auth/logout', { method: 'POST' });
      setUsuario(null);
    },
    async recargar() {
      const respuesta = await api('/auth/me');
      setUsuario(respuesta.usuario);
    },
  }), [usuario, cargando]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

