import { Router } from 'express';
import { pool } from '../config/db.js';
import { validar } from '../middleware/validar.js';

export function crearCrud({ tabla, columnas, schema, select = '*', joins = '', orderBy = 'id DESC' }) {
  const router = Router();
  const nombres = Object.keys(columnas);
  const lista = nombres.join(', ');
  const marcadores = nombres.map(() => '?').join(', ');

  router.get('/', async (req, res, next) => {
    try {
      const [datos] = await pool.query(`SELECT ${select} FROM ${tabla} ${joins} ORDER BY ${orderBy}`);
      res.json({ datos });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const [filas] = await pool.execute(`SELECT ${select} FROM ${tabla} ${joins} WHERE ${tabla}.id = ?`, [req.params.id]);
      if (!filas[0]) return res.status(404).json({ error: 'Registro no encontrado' });
      return res.json({ dato: filas[0] });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/', validar(schema), async (req, res, next) => {
    try {
      const valores = nombres.map((nombre) => req.body[nombre]);
      const [resultado] = await pool.execute(
        `INSERT INTO ${tabla} (${lista}) VALUES (${marcadores})`,
        valores,
      );
      return res.status(201).json({ id: resultado.insertId, mensaje: 'Registro creado' });
    } catch (error) {
      return next(error);
    }
  });

  router.put('/:id', validar(schema), async (req, res, next) => {
    try {
      const asignaciones = nombres.map((nombre) => `${nombre} = ?`).join(', ');
      const valores = [...nombres.map((nombre) => req.body[nombre]), req.params.id];
      const [resultado] = await pool.execute(
        `UPDATE ${tabla} SET ${asignaciones} WHERE id = ?`,
        valores,
      );
      if (!resultado.affectedRows) return res.status(404).json({ error: 'Registro no encontrado' });
      return res.json({ mensaje: 'Registro actualizado' });
    } catch (error) {
      return next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const [resultado] = await pool.execute(`DELETE FROM ${tabla} WHERE id = ?`, [req.params.id]);
      if (!resultado.affectedRows) return res.status(404).json({ error: 'Registro no encontrado' });
      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

