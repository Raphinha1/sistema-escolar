import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import app from '../src/app.js';
import { pool, verificarConexion } from '../src/config/db.js';

let servidor;
let base;
let cookieAdmin;
let cookieUsuario;
const sufijo = `${Date.now()}`.slice(-8);
const username = `prueba_${sufijo}`;
const correo = `${username}@escuela.local`;
const password = 'Prueba#2026';
let usuarioId;
let maestroId;
let grupoId;
let materiaId;
let alumnoId;

async function solicitud(ruta, { cookie, body, ...opciones } = {}) {
  const headers = { ...(opciones.headers || {}) };
  let cuerpo = body;
  if (body && !(body instanceof FormData)) {
    headers['content-type'] = 'application/json';
    cuerpo = JSON.stringify(body);
  }
  return fetch(`${base}/api${ruta}`, { ...opciones, headers: { ...headers, ...(cookie ? { cookie } : {}) }, body: cuerpo });
}

before(async () => {
  await verificarConexion();
  servidor = app.listen(0);
  await new Promise((resolve) => servidor.once('listening', resolve));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  if (alumnoId) await pool.execute('DELETE FROM alumnos WHERE id = ?', [alumnoId]).catch(() => {});
  if (materiaId) await pool.execute('DELETE FROM materias WHERE id = ?', [materiaId]).catch(() => {});
  if (grupoId) await pool.execute('DELETE FROM grupos WHERE id = ?', [grupoId]).catch(() => {});
  if (maestroId) await pool.execute('DELETE FROM maestros WHERE id = ?', [maestroId]).catch(() => {});
  if (usuarioId) await pool.execute("DELETE FROM usuarios WHERE id = ? AND rol = 'usuario'", [usuarioId]).catch(() => {});
  await pool.end();
  if (servidor) await new Promise((resolve) => servidor.close(resolve));
});

test('1. rechaza credenciales incorrectas', async () => {
  const respuesta = await solicitud('/auth/login', { method: 'POST', body: { username: 'Admin', password: 'incorrecta' } });
  assert.equal(respuesta.status, 401);
});

test('2. una inyección SQL no evade el login', async () => {
  const respuesta = await solicitud('/auth/login', { method: 'POST', body: { username: "' OR '1'='1", password: 'x' } });
  assert.equal(respuesta.status, 401);
});

test('3. inicia sesión y entrega una cookie protegida', async () => {
  const respuesta = await solicitud('/auth/login', { method: 'POST', body: { username: 'Admin', password: '$3cr3t' } });
  assert.equal(respuesta.status, 200);
  cookieAdmin = respuesta.headers.get('set-cookie').split(';')[0];
  const cabecera = respuesta.headers.get('set-cookie').toLowerCase();
  assert.match(cabecera, /httponly/);
  assert.match(cabecera, /samesite=strict/);
});

test('4. consulta al usuario de la sesión', async () => {
  const respuesta = await solicitud('/auth/me', { cookie: cookieAdmin });
  assert.equal(respuesta.status, 200);
  assert.equal((await respuesta.json()).usuario.rol, 'admin');
});

test('5. impide crear contraseñas débiles', async () => {
  const respuesta = await solicitud('/usuarios', {
    method: 'POST', cookie: cookieAdmin,
    body: { nombre: 'Cuenta débil', username: `debil_${sufijo}`, correo: null, password: '123', activo: true },
  });
  assert.equal(respuesta.status, 400);
});

test('6. fuerza el rol usuario aunque se solicite admin', async () => {
  const respuesta = await solicitud('/usuarios', {
    method: 'POST', cookie: cookieAdmin,
    body: { nombre: 'Usuario de prueba', username, correo, password, activo: true, rol: 'admin' },
  });
  assert.equal(respuesta.status, 201);
  usuarioId = (await respuesta.json()).id;
  const [[usuario]] = await pool.execute('SELECT rol FROM usuarios WHERE id = ?', [usuarioId]);
  assert.equal(usuario.rol, 'usuario');
});

test('7. un usuario normal puede iniciar sesión', async () => {
  const respuesta = await solicitud('/auth/login', { method: 'POST', body: { username, password } });
  assert.equal(respuesta.status, 200);
  cookieUsuario = respuesta.headers.get('set-cookie').split(';')[0];
});

test('8. un usuario normal no puede administrar usuarios', async () => {
  const respuesta = await solicitud('/usuarios', { cookie: cookieUsuario });
  assert.equal(respuesta.status, 403);
});

test('9. el resumen requiere y acepta una sesión', async () => {
  assert.equal((await solicitud('/resumen')).status, 401);
  assert.equal((await solicitud('/resumen', { cookie: cookieUsuario })).status, 200);
});

test('10. crea registros de maestro y grupo', async () => {
  let respuesta = await solicitud('/maestros', {
    method: 'POST', cookie: cookieAdmin,
    body: { nombre: 'Maestro de prueba', correo: `maestro_${sufijo}@escuela.local`, especialidad: 'Pruebas', telefono: '5551234567' },
  });
  assert.equal(respuesta.status, 201);
  maestroId = (await respuesta.json()).id;
  respuesta = await solicitud('/grupos', {
    method: 'POST', cookie: cookieAdmin,
    body: { nombre: `T${sufijo}`, grado: 7, turno: 'Matutino', ciclo_escolar: '2026-2027' },
  });
  assert.equal(respuesta.status, 201);
  grupoId = (await respuesta.json()).id;
});

test('11. completa el CRUD de materia', async () => {
  let respuesta = await solicitud('/materias', {
    method: 'POST', cookie: cookieAdmin,
    body: { nombre: 'Materia de prueba', clave: `P-${sufijo}`, creditos: 5, maestro_id: maestroId },
  });
  assert.equal(respuesta.status, 201);
  materiaId = (await respuesta.json()).id;
  respuesta = await solicitud(`/materias/${materiaId}`, {
    method: 'PUT', cookie: cookieAdmin,
    body: { nombre: 'Materia actualizada', clave: `P-${sufijo}`, creditos: 6, maestro_id: maestroId },
  });
  assert.equal(respuesta.status, 200);
  respuesta = await solicitud(`/materias/${materiaId}`, { cookie: cookieAdmin });
  assert.equal((await respuesta.json()).dato.creditos, 6);
});

test('12. crea alumno y respeta llaves foráneas', async () => {
  let respuesta = await solicitud('/alumnos', {
    method: 'POST', cookie: cookieAdmin,
    body: { matricula: `A${sufijo}`, nombre: 'Alumno de prueba', correo: `alumno_${sufijo}@escuela.local`, fecha_nacimiento: '2012-05-01', grupo_id: grupoId, materia_id: materiaId },
  });
  assert.equal(respuesta.status, 201);
  alumnoId = (await respuesta.json()).id;
  respuesta = await solicitud(`/maestros/${maestroId}`, { method: 'DELETE', cookie: cookieAdmin });
  assert.equal(respuesta.status, 409);
});

test('13. bloquea un tercer administrador y archivos disfrazados', async () => {
  await assert.rejects(
    pool.execute("INSERT INTO usuarios (nombre, username, password_hash, rol) VALUES ('Tercero', ?, 'x', 'admin')", [`admin_${sufijo}`]),
    (error) => error.sqlState === '45000',
  );
  const formulario = new FormData();
  formulario.append('foto', new Blob(['esto no es una imagen'], { type: 'image/png' }), 'foto.png');
  const respuesta = await solicitud('/auth/me/foto', { method: 'PUT', cookie: cookieAdmin, body: formulario });
  assert.equal(respuesta.status, 400);
});
