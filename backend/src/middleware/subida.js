import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
fs.mkdirSync(raiz, { recursive: true });

const extensiones = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

const firmas = [
  { tipo: 'image/jpeg', coincide: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { tipo: 'image/png', coincide: (b) => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  { tipo: 'image/webp', coincide: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
];

const almacenamiento = multer.diskStorage({
  destination: raiz,
  filename: (req, archivo, cb) => cb(null, `${crypto.randomUUID()}${extensiones.get(archivo.mimetype)}`),
});

export const recibirFoto = multer({
  storage: almacenamiento,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, archivo, cb) => {
    if (!extensiones.has(archivo.mimetype)) return cb(new Error('Tipo de imagen no permitido'));
    return cb(null, true);
  },
}).single('foto');

export async function validarContenidoImagen(req, res, next) {
  if (!req.file) return res.status(400).json({ error: 'Selecciona una imagen' });
  try {
    const descriptor = await fs.promises.open(req.file.path, 'r');
    const buffer = Buffer.alloc(16);
    await descriptor.read(buffer, 0, 16, 0);
    await descriptor.close();
    const firma = firmas.find(({ coincide }) => coincide(buffer));
    if (!firma || firma.tipo !== req.file.mimetype) {
      await fs.promises.unlink(req.file.path);
      return res.status(400).json({ error: 'El archivo no es una imagen válida' });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

