export default function Avatar({ usuario, grande = false }) {
  if (usuario?.foto) {
    return <img className={`avatar ${grande ? 'avatar-grande' : ''}`} src={usuario.foto} alt={`Foto de ${usuario.nombre}`} />;
  }
  const iniciales = usuario?.nombre?.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
  return <div className={`avatar avatar-iniciales ${grande ? 'avatar-grande' : ''}`} aria-label="Sin foto">{iniciales}</div>;
}

