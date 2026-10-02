import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { autenticar, crearToken, opcionesCookie } from '../middleware/auth.js';
import { recibirFoto, validarContenidoImagen } from '../middleware/subida.js';
import { validar } from '../middleware/validar.js';
import { loginSchema, passwordSchema } from '../validators/esquemas.js';

const router = Router();
const hashFalso = bcrypt.hash('comparacion-de-tiempo-constante', 12);

const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos. Espera 15 minutos' },
});

function usuarioPublico(usuario) {
  const { password_hash, intentos_fallidos, bloqueado_hasta, ...seguro } = usuario;
  return seguro;
}

router.post('/login', limitadorLogin, validar(loginSchema), async (req, res, next) => {
  try {
    const [filas] = await pool.execute('SELECT * FROM usuarios WHERE username = ? LIMIT 1', [req.body.username]);
    const usuario = filas[0];
    const hash = usuario?.password_hash || await hashFalso;
    const coincide = await bcrypt.compare(req.body.password, hash);

    if (!usuario || !coincide) {
      if (usuario) {
        const intentos = usuario.intentos_fallidos + 1;
        if (intentos >= 5) {
          await pool.execute(
            'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?',
            [usuario.id],
          );
        } else {
          await pool.execute('UPDATE usuarios SET intentos_fallidos = ? WHERE id = ?', [intentos, usuario.id]);
        }
      }
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    if (!usuario.activo) return res.status(403).json({ error: 'La cuenta está desactivada' });
    if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
      return res.status(423).json({ error: 'Cuenta bloqueada temporalmente' });
    }

    await pool.execute(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?',
      [usuario.id],
    );
    res.cookie('lab_token', crearToken(usuario), opcionesCookie());
    return res.json({ usuario: usuarioPublico(usuario) });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('lab_token', opcionesCookie());
  res.status(204).end();
});

router.get('/me', autenticar, (req, res) => res.json({ usuario: req.usuario }));

router.put('/me/password', autenticar, validar(passwordSchema), async (req, res, next) => {
  try {
    const [filas] = await pool.execute('SELECT password_hash FROM usuarios WHERE id = ?', [req.usuario.id]);
    const coincide = await bcrypt.compare(req.body.actual, filas[0].password_hash);
    if (!coincide) return res.status(400).json({ error: 'La contraseña actual no coincide' });
    const hash = await bcrypt.hash(req.body.nueva, 12);
    await pool.execute('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, req.usuario.id]);
    return res.json({ mensaje: 'Contraseña actualizada' });
  } catch (error) {
    return next(error);
  }
});

router.put('/me/foto', autenticar, recibirFoto, validarContenidoImagen, async (req, res, next) => {
  try {
    const nuevaFoto = `/uploads/${req.file.filename}`;
    await pool.execute('UPDATE usuarios SET foto = ? WHERE id = ?', [nuevaFoto, req.usuario.id]);
    if (req.usuario.foto?.startsWith('/uploads/')) {
      const anterior = path.resolve('uploads', path.basename(req.usuario.foto));
      fs.promises.unlink(anterior).catch(() => {});
    }
    return res.json({ foto: nuevaFoto });
  } catch (error) {
    fs.promises.unlink(req.file.path).catch(() => {});
    return next(error);
  }
});

export default router;

