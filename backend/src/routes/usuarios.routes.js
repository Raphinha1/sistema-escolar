import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { soloAdmin } from '../middleware/auth.js';
import { validar } from '../middleware/validar.js';
import { usuarioCrearSchema, usuarioEditarSchema } from '../validators/esquemas.js';

const router = Router();
router.use(soloAdmin);

router.get('/', async (req, res, next) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT id, nombre, username, correo, rol, foto, activo, creado_en
       FROM usuarios ORDER BY rol = 'admin' DESC, nombre`,
    );
    res.json({ datos: usuarios });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [filas] = await pool.execute(
      'SELECT id, nombre, username, correo, rol, foto, activo, creado_en FROM usuarios WHERE id = ?',
      [req.params.id],
    );
    if (!filas[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json({ dato: filas[0] });
  } catch (error) {
    return next(error);
  }
});

router.post('/', validar(usuarioCrearSchema), async (req, res, next) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 12);
    const [resultado] = await pool.execute(
      `INSERT INTO usuarios (nombre, username, correo, password_hash, rol, activo)
       VALUES (?, ?, ?, ?, 'usuario', ?)`,
      [req.body.nombre, req.body.username, req.body.correo, hash, req.body.activo],
    );
    return res.status(201).json({ id: resultado.insertId, mensaje: 'Usuario creado' });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', validar(usuarioEditarSchema), async (req, res, next) => {
  try {
    const [filas] = await pool.execute('SELECT rol FROM usuarios WHERE id = ?', [req.params.id]);
    if (!filas[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (filas[0].rol === 'admin') return res.status(409).json({ error: 'Los administradores están protegidos' });

    const valores = [req.body.nombre, req.body.username, req.body.correo, req.body.activo];
    let sql = 'UPDATE usuarios SET nombre = ?, username = ?, correo = ?, activo = ?';
    if (req.body.password) {
      sql += ', password_hash = ?';
      valores.push(await bcrypt.hash(req.body.password, 12));
    }
    sql += ' WHERE id = ?';
    valores.push(req.params.id);
    await pool.execute(sql, valores);
    return res.json({ mensaje: 'Usuario actualizado' });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [resultado] = await pool.execute("DELETE FROM usuarios WHERE id = ? AND rol <> 'admin'", [req.params.id]);
    if (!resultado.affectedRows) return res.status(409).json({ error: 'El usuario no existe o está protegido' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;

