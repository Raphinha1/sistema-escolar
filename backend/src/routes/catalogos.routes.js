import { Router } from 'express';
import { crearCrud } from './crud.factory.js';
import { alumnoSchema, grupoSchema, maestroSchema, materiaSchema } from '../validators/esquemas.js';

const router = Router();

router.use('/maestros', crearCrud({
  tabla: 'maestros',
  columnas: { nombre: true, correo: true, especialidad: true, telefono: true },
  schema: maestroSchema,
  select: 'maestros.id, maestros.nombre, maestros.correo, maestros.especialidad, maestros.telefono, maestros.creado_en',
  orderBy: 'maestros.nombre',
}));

router.use('/materias', crearCrud({
  tabla: 'materias',
  columnas: { nombre: true, clave: true, creditos: true, maestro_id: true },
  schema: materiaSchema,
  select: 'materias.id, materias.nombre, materias.clave, materias.creditos, materias.maestro_id, maestros.nombre AS maestro',
  joins: 'JOIN maestros ON maestros.id = materias.maestro_id',
  orderBy: 'materias.nombre',
}));

router.use('/grupos', crearCrud({
  tabla: 'grupos',
  columnas: { nombre: true, grado: true, turno: true, ciclo_escolar: true },
  schema: grupoSchema,
  select: 'grupos.id, grupos.nombre, grupos.grado, grupos.turno, grupos.ciclo_escolar',
  orderBy: 'grupos.grado, grupos.nombre',
}));

router.use('/alumnos', crearCrud({
  tabla: 'alumnos',
  columnas: {
    matricula: true,
    nombre: true,
    correo: true,
    fecha_nacimiento: true,
    grupo_id: true,
    materia_id: true,
  },
  schema: alumnoSchema,
  select: `alumnos.id, alumnos.matricula, alumnos.nombre, alumnos.correo,
    alumnos.fecha_nacimiento, alumnos.grupo_id, grupos.nombre AS grupo,
    alumnos.materia_id, materias.nombre AS materia`,
  joins: 'JOIN grupos ON grupos.id = alumnos.grupo_id JOIN materias ON materias.id = alumnos.materia_id',
  orderBy: 'alumnos.nombre',
}));

export default router;
