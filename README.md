# Sistema escolar

Aplicación del laboratorio con API REST en Node.js y Express, interfaz en React con Vite y base de datos MariaDB.

## Requisitos

- Node.js 22 o posterior
- MariaDB 10.6 o posterior

## Instalación rápida

1. Edita la contraseña de `lab_app` al final de `backend/database/schema.sql`.
2. Crea la base: `sudo mariadb < backend/database/schema.sql`.
3. En `backend`, copia `.env.example` como `.env`, ajusta `DB_PASSWORD` y genera un secreto JWT con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
4. Ejecuta `npm install`, `npm run seed` y `npm run dev` en `backend`.
5. Ejecuta `npm install` y `npm run dev` en `frontend`.
6. Abre <http://localhost:5173>.

El seed crea dos administradores:

- `Admin` / `$3cr3t`
- `Root` / `W@t@SHi09`

Por seguridad, cambia ambas contraseñas desde **Mi perfil** después de la primera ejecución.

## Pruebas

Con MariaDB activa y la base inicializada:

```bash
cd backend
npm run seed
npm test
```

También puedes abrir `backend/api.http` con REST Client para recorrer la API manualmente.

## Estructura

- `backend/database/schema.sql`: tablas, relaciones, triggers y usuario de MariaDB.
- `backend/src`: API, autenticación, validación, carga segura de fotos y seed.
- `backend/test/api.test.js`: 13 pruebas de integración y seguridad.
- `frontend/src`: dashboard, rutas protegidas, perfil y los cinco CRUD.
