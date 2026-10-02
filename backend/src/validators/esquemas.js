import { z } from 'zod';

const texto = (min, max) => z.string().trim().min(min).max(max);
const correoOpcional = z.union([z.email(), z.literal('')]).optional().transform((v) => v || null);
const id = z.coerce.number().int().positive();

export const loginSchema = z.object({
  username: texto(2, 40),
  password: z.string().min(1).max(200),
}).strict();

export const passwordSchema = z.object({
  actual: z.string().min(1).max(200),
  nueva: z.string()
    .min(10, 'Debe tener al menos 10 caracteres')
    .max(72)
    .regex(/[A-Z]/, 'Debe incluir una mayúscula')
    .regex(/[a-z]/, 'Debe incluir una minúscula')
    .regex(/[0-9]/, 'Debe incluir un número')
    .regex(/[^A-Za-z0-9]/, 'Debe incluir un símbolo'),
}).strict();

export const usuarioCrearSchema = z.object({
  nombre: texto(2, 100),
  username: texto(3, 40).regex(/^[A-Za-z0-9._-]+$/, 'Usa letras, números, punto, guion o guion bajo'),
  correo: correoOpcional,
  password: passwordSchema.shape.nueva,
  activo: z.boolean().optional().default(true),
  rol: z.string().optional(),
}).strict();

export const usuarioEditarSchema = z.object({
  nombre: texto(2, 100),
  username: texto(3, 40).regex(/^[A-Za-z0-9._-]+$/),
  correo: correoOpcional,
  activo: z.boolean(),
  password: z.union([passwordSchema.shape.nueva, z.literal('')]).optional(),
}).strict();

export const maestroSchema = z.object({
  nombre: texto(2, 120),
  correo: z.email(),
  especialidad: texto(2, 120),
  telefono: z.union([texto(7, 25), z.literal('')]).optional().transform((v) => v || null),
}).strict();

export const materiaSchema = z.object({
  nombre: texto(2, 120),
  clave: texto(2, 30).transform((v) => v.toUpperCase()),
  creditos: z.coerce.number().int().min(1).max(20),
  maestro_id: id,
}).strict();

export const grupoSchema = z.object({
  nombre: texto(1, 50),
  grado: z.coerce.number().int().min(1).max(12),
  turno: z.enum(['Matutino', 'Vespertino']),
  ciclo_escolar: z.string().regex(/^\d{4}-\d{4}$/, 'Usa el formato 2026-2027'),
}).strict();

export const alumnoSchema = z.object({
  matricula: texto(2, 30).transform((v) => v.toUpperCase()),
  nombre: texto(2, 120),
  correo: correoOpcional,
  fecha_nacimiento: z.string().date(),
  grupo_id: id,
  materia_id: id,
}).strict();
