import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

function secretoJwt() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  }
  return process.env.JWT_SECRET;
}

export function crearToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, rol: usuario.rol },
    secretoJwt(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  );
}

export function opcionesCookie() {
  const produccion = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: produccion,
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  };
}

export async function autenticar(req, res, next) {
  try {
    const token = req.cookies.lab_token;
    if (!token) return res.status(401).json({ error: 'Inicia sesión para continuar' });

    const payload = jwt.verify(token, secretoJwt());
    const [filas] = await pool.execute(
      `SELECT id, nombre, username, correo, rol, foto, activo
       FROM usuarios WHERE id = ? LIMIT 1`,
      [payload.sub],
    );
    const usuario = filas[0];
    if (!usuario || !usuario.activo) {
      res.clearCookie('lab_token', opcionesCookie());
      return res.status(401).json({ error: 'La sesión ya no es válida' });
    }
    req.usuario = usuario;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.clearCookie('lab_token', opcionesCookie());
      return res.status(401).json({ error: 'La sesión expiró o no es válida' });
    }
    return next(error);
  }
}

export function soloAdmin(req, res, next) {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Se requiere el rol Administrador' });
  }
  return next();
}

