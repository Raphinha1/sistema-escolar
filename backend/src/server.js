import app from './app.js';
import { verificarConexion } from './config/db.js';

const puerto = Number(process.env.PORT || 3000);

try {
  await verificarConexion();
  console.log('Conectado a MariaDB');
  app.listen(puerto, () => console.log(`API escuchando en http://localhost:${puerto}`));
} catch (error) {
  console.error('No fue posible iniciar la API:', error.message);
  process.exit(1);
}

