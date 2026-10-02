import bcrypt from 'bcryptjs';
import { pool, verificarConexion } from '../config/db.js';

async function guardarAdmin(conexion, { nombre, username, password, correo }) {
  const hash = await bcrypt.hash(password, 12);
  const [existentes] = await conexion.execute('SELECT id, rol FROM usuarios WHERE username = ?', [username]);
  if (existentes[0]) {
    if (existentes[0].rol !== 'admin') {
      throw new Error(`${username} existe, pero no tiene rol admin`);
    }
    await conexion.execute(
      'UPDATE usuarios SET nombre = ?, correo = ?, password_hash = ?, activo = TRUE, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?',
      [nombre, correo, hash, existentes[0].id],
    );
  } else {
    await conexion.execute(
      "INSERT INTO usuarios (nombre, username, correo, password_hash, rol) VALUES (?, ?, ?, ?, 'admin')",
      [nombre, username, correo, hash],
    );
  }
}

async function ejecutar() {
  await verificarConexion();
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    await guardarAdmin(conexion, {
      nombre: 'Administrador del sistema',
      username: 'Admin',
      correo: 'admin@escuela.local',
      password: '$3cr3t',
    });
    await guardarAdmin(conexion, {
      nombre: 'Administrador raíz',
      username: 'Root',
      correo: 'root@escuela.local',
      password: 'W@t@SHi09',
    });

    await conexion.execute(
      `INSERT INTO maestros (nombre, correo, especialidad, telefono)
       VALUES ('Elena Ramírez', 'elena@escuela.local', 'Matemáticas', '5551234567')
       ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), especialidad = VALUES(especialidad), telefono = VALUES(telefono)`,
    );
    const [[maestro]] = await conexion.query("SELECT id FROM maestros WHERE correo = 'elena@escuela.local'");

    await conexion.execute(
      `INSERT INTO materias (nombre, clave, creditos, maestro_id)
       VALUES ('Álgebra', 'MAT-101', 8, ?)
       ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), creditos = VALUES(creditos), maestro_id = VALUES(maestro_id)`,
      [maestro.id],
    );
    const [[materia]] = await conexion.query("SELECT id FROM materias WHERE clave = 'MAT-101'");

    await conexion.execute(
      `INSERT INTO grupos (nombre, grado, turno, ciclo_escolar)
       VALUES ('7A', 7, 'Matutino', '2026-2027')
       ON DUPLICATE KEY UPDATE grado = VALUES(grado), turno = VALUES(turno), ciclo_escolar = VALUES(ciclo_escolar)`,
    );
    const [[grupo]] = await conexion.query("SELECT id FROM grupos WHERE nombre = '7A'");

    await conexion.execute(
      `INSERT INTO alumnos (matricula, nombre, correo, fecha_nacimiento, grupo_id, materia_id)
       VALUES ('A2026001', 'María López', 'maria@escuela.local', '2012-04-18', ?, ?)
       ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), correo = VALUES(correo), fecha_nacimiento = VALUES(fecha_nacimiento), grupo_id = VALUES(grupo_id), materia_id = VALUES(materia_id)`,
      [grupo.id, materia.id],
    );

    await conexion.commit();
    console.log('Seed completado: Admin, Root y datos de ejemplo disponibles');
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
    await pool.end();
  }
}

ejecutar().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

