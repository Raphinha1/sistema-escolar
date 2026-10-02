import multer from 'multer';

export function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

export function manejarError(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    const mensaje = error.code === 'LIMIT_FILE_SIZE'
      ? 'La imagen no puede exceder 2 MB'
      : 'No se pudo procesar el archivo';
    return res.status(400).json({ error: mensaje });
  }

  if (error.message === 'Tipo de imagen no permitido') {
    return res.status(400).json({ error: error.message });
  }

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos' });
  }

  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ error: 'No se puede eliminar porque existen registros relacionados' });
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'La relación seleccionada no existe' });
  }

  if (error.sqlState === '45000') {
    return res.status(409).json({ error: error.sqlMessage || 'La operación viola una regla de negocio' });
  }

  console.error(error);
  return res.status(500).json({ error: 'Ocurrió un error interno' });
}
