// Función para obtener la fecha y hora actual como una cadena en el formato YYYY-MM-DD HH:MM:SS
export function getDateTimeString() {
  const date = new Date();

  // Obtiene los componentes de la fecha y hora actual
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // Construye la cadena de fecha y hora en el formato deseado
  const dateTimeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  return dateTimeString;
}
