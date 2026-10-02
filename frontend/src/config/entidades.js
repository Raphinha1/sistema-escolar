export const entidades = {
  usuarios: {
    titulo: 'Usuarios',
    descripcion: 'Cuentas con acceso al sistema',
    endpoint: '/usuarios',
    admin: true,
    columnas: [
      ['nombre', 'Nombre'], ['username', 'Usuario'], ['correo', 'Correo'], ['rol', 'Rol'], ['activo', 'Estado'],
    ],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre completo', requerido: true },
      { nombre: 'username', etiqueta: 'Usuario', requerido: true },
      { nombre: 'correo', etiqueta: 'Correo', tipo: 'email' },
      { nombre: 'password', etiqueta: 'Contraseña', tipo: 'password', ayuda: '10 caracteres, mayúscula, minúscula, número y símbolo' },
      { nombre: 'activo', etiqueta: 'Cuenta activa', tipo: 'checkbox', inicial: true },
    ],
  },
  alumnos: {
    titulo: 'Alumnos', descripcion: 'Matrícula y asignación académica', endpoint: '/alumnos',
    columnas: [['matricula', 'Matrícula'], ['nombre', 'Nombre'], ['correo', 'Correo'], ['grupo', 'Grupo'], ['materia', 'Materia']],
    campos: [
      { nombre: 'matricula', etiqueta: 'Matrícula', requerido: true },
      { nombre: 'nombre', etiqueta: 'Nombre completo', requerido: true },
      { nombre: 'correo', etiqueta: 'Correo', tipo: 'email' },
      { nombre: 'fecha_nacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'date', requerido: true },
      { nombre: 'grupo_id', etiqueta: 'Grupo', tipo: 'select', opciones: '/grupos', texto: 'nombre', requerido: true },
      { nombre: 'materia_id', etiqueta: 'Materia', tipo: 'select', opciones: '/materias', texto: 'nombre', requerido: true },
    ],
  },
  maestros: {
    titulo: 'Maestros', descripcion: 'Directorio del personal docente', endpoint: '/maestros',
    columnas: [['nombre', 'Nombre'], ['correo', 'Correo'], ['especialidad', 'Especialidad'], ['telefono', 'Teléfono']],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre completo', requerido: true },
      { nombre: 'correo', etiqueta: 'Correo', tipo: 'email', requerido: true },
      { nombre: 'especialidad', etiqueta: 'Especialidad', requerido: true },
      { nombre: 'telefono', etiqueta: 'Teléfono' },
    ],
  },
  materias: {
    titulo: 'Materias', descripcion: 'Oferta académica y docente responsable', endpoint: '/materias',
    columnas: [['clave', 'Clave'], ['nombre', 'Materia'], ['creditos', 'Créditos'], ['maestro', 'Maestro']],
    campos: [
      { nombre: 'clave', etiqueta: 'Clave', requerido: true },
      { nombre: 'nombre', etiqueta: 'Nombre', requerido: true },
      { nombre: 'creditos', etiqueta: 'Créditos', tipo: 'number', min: 1, max: 20, requerido: true },
      { nombre: 'maestro_id', etiqueta: 'Maestro', tipo: 'select', opciones: '/maestros', texto: 'nombre', requerido: true },
    ],
  },
  grupos: {
    titulo: 'Grupos', descripcion: 'Grupos por grado, turno y ciclo', endpoint: '/grupos',
    columnas: [['nombre', 'Grupo'], ['grado', 'Grado'], ['turno', 'Turno'], ['ciclo_escolar', 'Ciclo escolar']],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', requerido: true },
      { nombre: 'grado', etiqueta: 'Grado', tipo: 'number', min: 1, max: 12, requerido: true },
      { nombre: 'turno', etiqueta: 'Turno', tipo: 'select-estatico', valores: ['Matutino', 'Vespertino'], requerido: true },
      { nombre: 'ciclo_escolar', etiqueta: 'Ciclo escolar', placeholder: '2026-2027', requerido: true },
    ],
  },
};
