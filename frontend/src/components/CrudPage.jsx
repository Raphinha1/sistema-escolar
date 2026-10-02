import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import { entidades } from '../config/entidades.js';

function valorInicial(campo) {
  if (campo.tipo === 'checkbox') return campo.inicial ?? false;
  if (campo.tipo === 'select-estatico') return campo.valores[0];
  return '';
}

export default function CrudPage() {
  const { entidad: nombreEntidad } = useParams();
  const entidad = entidades[nombreEntidad];
  const [datos, setDatos] = useState([]);
  const [opciones, setOpciones] = useState({});
  const [editando, setEditando] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [formulario, setFormulario] = useState({});
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  const nuevoFormulario = useMemo(
    () => Object.fromEntries((entidad?.campos || []).map((campo) => [campo.nombre, valorInicial(campo)])),
    [entidad],
  );

  const cargar = useCallback(async () => {
    if (!entidad) return;
    setCargando(true);
    try {
      const respuesta = await api(entidad.endpoint);
      setDatos(respuesta.datos);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [entidad]);

  useEffect(() => {
    setEditando(null);
    setMostrarForm(false);
    setFormulario(nuevoFormulario);
    setOpciones({});
    cargar();
    const remotos = (entidad?.campos || []).filter((campo) => campo.opciones);
    Promise.all(remotos.map(async (campo) => {
      const respuesta = await api(campo.opciones);
      return [campo.nombre, respuesta.datos];
    })).then((pares) => setOpciones(Object.fromEntries(pares))).catch((e) => setError(e.message));
  }, [entidad, nuevoFormulario, cargar]);

  if (!entidad) return <div className="alert alert-danger">Catálogo no encontrado.</div>;

  function abrirNuevo() {
    setEditando(null);
    setFormulario(nuevoFormulario);
    setError('');
    setMostrarForm(true);
  }

  function abrirEdicion(registro) {
    const valores = Object.fromEntries(entidad.campos.map((campo) => [
      campo.nombre,
      campo.nombre === 'password' ? '' : (registro[campo.nombre] ?? valorInicial(campo)),
    ]));
    setEditando(registro.id);
    setFormulario(valores);
    setError('');
    setMostrarForm(true);
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError('');
    try {
      const ruta = editando ? `${entidad.endpoint}/${editando}` : entidad.endpoint;
      await api(ruta, { method: editando ? 'PUT' : 'POST', body: formulario });
      setMostrarForm(false);
      await cargar();
    } catch (e) {
      const detalle = e.detalles?.map((d) => `${d.campo}: ${d.mensaje}`).join(' · ');
      setError(detalle || e.message);
    }
  }

  async function eliminar(registro) {
    if (!window.confirm(`¿Eliminar “${registro.nombre || registro.matricula}”?`)) return;
    try {
      await api(`${entidad.endpoint}/${registro.id}`, { method: 'DELETE' });
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1>{entidad.titulo}</h1>
          <p>{entidad.descripcion}</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}>Nuevo registro</button>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {mostrarForm && (
        <form className="panel formulario" onSubmit={guardar}>
          <div className="formulario-titulo">
            <h2>{editando ? 'Editar registro' : 'Nuevo registro'}</h2>
            <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setMostrarForm(false)} />
          </div>
          <div className="row g-3">
            {entidad.campos.map((campo) => (
              <div className={campo.tipo === 'checkbox' ? 'col-12' : 'col-md-6'} key={campo.nombre}>
                {campo.tipo === 'checkbox' ? (
                  <label className="form-check">
                    <input className="form-check-input" type="checkbox" checked={Boolean(formulario[campo.nombre])}
                      onChange={(e) => setFormulario({ ...formulario, [campo.nombre]: e.target.checked })} />
                    <span className="form-check-label">{campo.etiqueta}</span>
                  </label>
                ) : (
                  <label className="form-label w-100">
                    {campo.etiqueta}
                    {campo.tipo === 'select' ? (
                      <select className="form-select mt-1" required={campo.requerido} value={formulario[campo.nombre]}
                        onChange={(e) => setFormulario({ ...formulario, [campo.nombre]: e.target.value })}>
                        <option value="">Selecciona una opción</option>
                        {(opciones[campo.nombre] || []).map((opcion) => <option key={opcion.id} value={opcion.id}>{opcion[campo.texto]}</option>)}
                      </select>
                    ) : campo.tipo === 'select-estatico' ? (
                      <select className="form-select mt-1" value={formulario[campo.nombre]}
                        onChange={(e) => setFormulario({ ...formulario, [campo.nombre]: e.target.value })}>
                        {campo.valores.map((valor) => <option key={valor}>{valor}</option>)}
                      </select>
                    ) : (
                      <input className="form-control mt-1" type={campo.tipo || 'text'} required={campo.requerido && !(editando && campo.nombre === 'password')}
                        min={campo.min} max={campo.max} placeholder={campo.placeholder || ''} value={formulario[campo.nombre]}
                        onChange={(e) => setFormulario({ ...formulario, [campo.nombre]: e.target.value })} />
                    )}
                    {campo.ayuda && <span className="form-text">{campo.ayuda}</span>}
                  </label>
                )}
              </div>
            ))}
          </div>
          <div className="acciones-formulario">
            <button type="button" className="btn btn-light" onClick={() => setMostrarForm(false)}>Cancelar</button>
            <button className="btn btn-primary" type="submit">Guardar</button>
          </div>
        </form>
      )}

      <div className="panel tabla-contenedor">
        {cargando ? <p className="estado-vacio">Cargando…</p> : datos.length === 0 ? (
          <p className="estado-vacio">Todavía no hay registros.</p>
        ) : (
          <table className="table align-middle mb-0">
            <thead><tr>{entidad.columnas.map(([, etiqueta]) => <th key={etiqueta}>{etiqueta}</th>)}<th className="text-end">Acciones</th></tr></thead>
            <tbody>{datos.map((registro) => {
              const protegido = nombreEntidad === 'usuarios' && registro.rol === 'admin';
              return (
                <tr key={registro.id}>
                  {entidad.columnas.map(([clave]) => (
                    <td key={clave}>
                      {clave === 'activo' ? <span className={`estado ${registro[clave] ? 'estado-activo' : ''}`}>{registro[clave] ? 'Activo' : 'Inactivo'}</span>
                        : clave === 'rol' ? (registro[clave] === 'admin' ? 'Administrador' : 'Usuario')
                          : (registro[clave] ?? '—')}
                    </td>
                  ))}
                  <td className="text-end acciones-tabla">
                    {protegido ? <span className="protegido">Protegido</span> : <>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => abrirEdicion(registro)}>Editar</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(registro)}>Eliminar</button>
                    </>}
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        )}
      </div>
    </section>
  );
}

