import { Service } from 'node-windows';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';
import fs from 'fs';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import chalk from 'chalk';

import checkStatus from './common/checkStatus.js';
import { logToFile } from './common/logToFile.js';

dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Obtener la ruta del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Obtener la ruta del archivo BAT desde las variables de entorno
const batFilePath = process.env.BATFILEPATH;

// Crear una instancia del servicio de Windows
const svc = new Service({
  name: 'ServiceMessage',
  description:
    'Servicio ServiceMessage creado con node-windows para monitorear el bachero servicio.bat',
  script: join(__dirname, 'app.js'),
  nodeOptions: ['--harmony', '--max_old_space_size=4096'],
  logpath: 'C:\\logs',
  grow: 0.25,
  wait: 1,
  maxrestarts: 3,
  abortOnError: false,
  stopparentfirst: false,
});

// Función para ejecutar el archivo BAT
async function executeBatFile() {
  // Verificar si el archivo BAT existe
  if (!fs.existsSync(batFilePath)) {
    logToFile(chalk.red(`El archivo ${batFilePath} no existe.`));
    return;
  }

  // Verificar el estado del servicio
  const status = await checkStatus();
  if (status !== 200) {
    setInterval(() => {
      const bat = spawn(batFilePath);

      // Manejar la salida estándar del proceso BAT
      bat.stdout.on('data', (data) => {
        console.log(chalk.green(data.toString()));
      });

      // Manejar la salida de error del proceso BAT
      bat.stderr.on('data', (data) => {
        logToFile(data.toString());
      });

      // Manejar el evento de salida del proceso BAT
      bat.on('exit', (code) => {
        const errorMessage = `Proceso de archivo service.bat finalizado con código ${code}`;
        logToFile(errorMessage);
        console.log(chalk.yellow(errorMessage));
      });
    }, 0.5 * 60 * 1000 * 1000);
  }
}

// Manejar el evento de instalación del servicio
svc.on('install', function (error) {
  if (error) {
    console.log(chalk.red('Error al instalar el servicio:', error));
    logToFile('Error al instalar el servicio:', error);
    return;
  }

  console.log(chalk.blue('Servicio se ha instalado correctamente...'));

  // Configurar las credenciales de inicio de sesión del servicio
  svc.logOnAsDomain = process.env.DOMAIN;
  svc.logOnAsAccount = process.env.ACCOUNT;
  svc.logOnAsPassword = process.env.PASSWORD;

  // Obtener el usuario local y el nombre de host
  const localUser = os.userInfo().username;
  const hostname = os.hostname();

  // Verificar si el usuario local y el nombre de host coinciden con las variables de entorno
  if (localUser === process.env.ACCOUNT && hostname === process.env.DOMAIN) {
    executeBatFile();
  } else {
    const errorMessage = `El usuario local (${localUser}) o el dominio (${hostname}) no coinciden con las variables de entorno (${process.env.ACCOUNT}, ${process.env.DOMAIN}).`;
    logToFile(errorMessage);
    console.log(chalk.red(errorMessage));
  }
});

// Manejar el evento de desinstalación del servicio
svc.on('uninstall', function (error) {
  if (error) {
    console.log(chalk.red('Error al desinstalar el servicio:', error));
    return;
  }

  console.log(chalk.blue('Servicio desinstalado.'));
});

// Verificar los argumentos de línea de comandos para instalar o desinstalar el servicio
if (process.argv[2] === 'install') {
  svc.install();
  console.log(chalk.green('Service installed.'));
  logToFile('Service installed.');
} else if (process.argv[2] === 'uninstall') {
  svc.uninstall();
  console.log(chalk.green('Service uninstalled.'));
  logToFile('Service uninstalled.');
} else {
  const errorMessage =
    'Error: Argumento no válido. Uso correcto: - Para instalar: node app.js install - Para desinstalar: node app.js uninstall';
  console.log(chalk.red(errorMessage));
  logToFile(errorMessage);
}
