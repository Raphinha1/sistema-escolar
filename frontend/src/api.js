export async function api(ruta, opciones = {}) {
  const configuracion = { credentials: 'include', ...opciones };
  if (configuracion.body && !(configuracion.body instanceof FormData)) {
    configuracion.headers = { 'Content-Type': 'application/json', ...configuracion.headers };
    configuracion.body = JSON.stringify(configuracion.body);
  }
  const respuesta = await fetch(`/api${ruta}`, configuracion);
  const contenido = respuesta.status === 204 ? null : await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const error = new Error(contenido?.error || 'No fue posible completar la solicitud');
    error.status = respuesta.status;
    error.detalles = contenido?.detalles;
    throw error;
  }
  return contenido;
}

