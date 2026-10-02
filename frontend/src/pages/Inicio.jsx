import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const etiquetas = { alumnos: 'Alumnos', maestros: 'Maestros', materias: 'Materias', grupos: 'Grupos' };

export default function Inicio() {
  const { usuario } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/resumen').then((r) => setResumen(r.resumen)).catch((e) => setError(e.message));
  }, []);

  return (
    <section>
      <div className="hero">
        <p className="eyebrow">Panel principal</p>
        <h1>Hola, {usuario.nombre.split(' ')[0]}</h1>
        <p>Aquí tienes una vista rápida de la información registrada en el sistema.</p>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="metricas">
        {Object.entries(etiquetas).map(([clave, etiqueta]) => (
          <article className="metrica" key={clave}>
            <span>{etiqueta}</span>
            <strong>{resumen?.[clave] ?? '—'}</strong>
          </article>
        ))}
      </div>
      <div className="panel bienvenida">
        <h2>Gestión académica en un solo lugar</h2>
        <p>Usa el menú lateral para registrar alumnos, organizar grupos, asignar materias y mantener actualizado el directorio de maestros.</p>
      </div>
    </section>
  );
}

