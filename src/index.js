import { Service } from 'node-windows';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';
import fs from 'fs';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

import checkStatus from './common/checkStatus.js';
import { logToFile } from './common/logToFile.js';

dotenv.config();

// Ruta al archivo .bat que se ejecutará
//const batFilePath = 'C:\\Bachero\\Operations.bat';
const batFilePath = process.env.BATFILEPATH;

// Obtén __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración del servicio
const svc = new Service({
  name: 'ServiceMessage',
  description:
    'Servicio ServiceMessage creado con node-windows para monitorear el bachero servicio.bat',
  script: join(__dirname, 'app.js'), // Ruta al archivo principal de tu aplicación
});

// Método para ejecutar el archivo .bat
async function executeBatFile() {
  // Verificar si el archivo .bat existe
  if (!fs.existsSync(batFilePath)) {
    logToFile(`El archivo ${batFilePath} no existe.`);
    return;
  }

  // Verificar el estado de la URL
  const status = await checkStatus(); // Usa la función importada checkStatus
  if (status !== 200) {
    // Si el estado es diferente de 200, ejecuta el archivo .bat cada 10 minutos
    setInterval(() => {
      const bat = spawn(batFilePath);

      // Manejar eventos de salida y error
      bat.stdout.on('data', (data) => {
        console.log(data.toString());
      });

      bat.stderr.on('data', (data) => {
        logToFile(data.toString());
      });

      bat.on('exit', (code) => {
        const errorMessage = `Proceso de archivo service.bat finalizado con código ${code}`;
        logToFile(errorMessage);
        console.log(
          `Proceso de archivo servicio.bat finalizado con código ${code}`
          );
      });
    }, 0.5 * 60 * 1000); // 1 minuto en milisegundos
    // }, 10 * 60 * 1000); // 10 minutos en milisegundos
  }
}

// Configurar el servicio
svc.on('install', () => {
  console.log('Servicio instalado correctamente...');

  svc.logOnAs.domain = process.env.DOMAIN;
  svc.logOnAs.account = process.env.ACCOUNT;
  svc.logOnAs.password = process.env.PASSWORD;

  // Obtén el nombre del usuario local actual
  const localUser = os.userInfo().username;

  // Verificar si el usuario local y el dominio coinciden con las variables de entorno
  if (
    localUser === process.env.ACCOUNT &&
    os.hostname() === process.env.DOMAIN
    ) {
    // Ejecutar el archivo .bat después de la instalación
    executeBatFile();
  } else {
    // Si no, registra un mensaje de error
    const errorMessage = `El usuario local (${localUser}) o el dominio (${os.hostname()}) no coinciden con las variables de entorno (${
      process.env.ACCOUNT
    }, ${process.env.DOMAIN}).`;
    logToFile(errorMessage);
    console.log(
      `El usuario local (${localUser}) o el dominio (${os.hostname()}) no coinciden con las variables de entorno (${
        process.env.ACCOUNT
      }, ${process.env.DOMAIN}).`
      );
  }
});

svc.on('uninstall', () => {
  console.log('Servicio desinstalado.');
});

// Instalar o desinstalar el servicio según el argumento de línea de comandos
if (process.argv[2] === 'install') {
  svc.install();
  logToFile('Service installed.');
} else if (process.argv[2] === 'uninstall') {
  svc.uninstall();
  logToFile('Service uninstalled.');
} else {
  const errorMessage = `Error: Argumento no válido. Uso correcto: - Para instalar: node app.js install - Para desinstalar: node app.js uninstall`;
  logToFile(errorMessage);
}
