import fs from 'fs';
import { getDateTimeString } from './getDateTimeString.js';

// Función para registrar un mensaje en un archivo .log
export function logToFile(message) {
  const dateTimeString = getDateTimeString();
  const logFileName = `C:\\logs\\error-${dateTimeString.slice(0, 10)}.log`;

  // Utilizar el método fs.promises.appendFile en lugar de fs.appendFileSync para evitar bloquear el hilo principal
  fs.promises.appendFile(logFileName, `${dateTimeString} - ${message}\n`)
    .catch((error) => {
      console.error(`Error al escribir en el archivo de registro: ${error}`);
    });
}
