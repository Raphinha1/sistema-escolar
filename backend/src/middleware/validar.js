export function validar(esquema) {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req.body);
    if (!resultado.success) {
      const detalles = resultado.error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensaje: issue.message,
      }));
      return res.status(400).json({ error: 'Datos no válidos', detalles });
    }
    req.body = resultado.data;
    return next();
  };
}

