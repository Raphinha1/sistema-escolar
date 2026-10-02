import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { pool } from './config/db.js';
import { autenticar } from './middleware/auth.js';
import { manejarError, rutaNoEncontrada } from './middleware/errores.js';
import authRoutes from './routes/auth.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import catalogosRoutes from './routes/catalogos.routes.js';

const app = express();
const carpetaActual = path.dirname(fileURLToPath(import.meta.url));

app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
}));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve(carpetaActual, '../uploads'), { index: false, fallthrough: false }));

app.get('/api/salud', (req, res) => res.json({ estado: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', autenticar, usuariosRoutes);
app.use('/api', autenticar, catalogosRoutes);

app.get('/api/resumen', autenticar, async (req, res, next) => {
  try {
    const [filas] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM alumnos) AS alumnos,
        (SELECT COUNT(*) FROM maestros) AS maestros,
        (SELECT COUNT(*) FROM materias) AS materias,
        (SELECT COUNT(*) FROM grupos) AS grupos
    `);
    res.json({ resumen: filas[0] });
  } catch (error) {
    next(error);
  }
});

app.use(rutaNoEncontrada);
app.use(manejarError);

export default app;

