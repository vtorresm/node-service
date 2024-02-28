import fs from 'fs';

import { getDateTimeString } from './getDateTimeString.js';

// Función para registrar un mensaje en un archivo .log
export function logToFile(message) {
  const dateTimeString = getDateTimeString();
  const logFileName = `C:\\logs\\error-${dateTimeString.slice(0, 10)}.log`;
  fs.appendFileSync(logFileName, `${dateTimeString} - ${message}\n`);
}
