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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const batFilePath = process.env.BATFILEPATH;

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

async function executeBatFile() {
  if (!fs.existsSync(batFilePath)) {
    logToFile(chalk.red(`El archivo ${batFilePath} no existe.`)); // Colorear mensaje de error en rojo
    return;
  }

  const status = await checkStatus();
  if (status !== 200) {
    setInterval(() => {
      const bat = spawn(batFilePath);

      bat.stdout.on('data', (data) => {
        console.log(chalk.green(data.toString())); // Colorear mensaje de salida en verde
      });

      bat.stderr.on('data', (data) => {
        logToFile(chalk.red(data.toString())); // Colorear mensaje de error en rojo
      });

      bat.on('exit', (code) => {
        const errorMessage = `Proceso de archivo service.bat finalizado con código ${code}`;
        logToFile(chalk.yellow(errorMessage)); // Colorear mensaje de advertencia en amarillo
        console.log(chalk.yellow(errorMessage)); // Colorear mensaje de advertencia en amarillo
      });
    }, 0.5 * 60 * 1000 * 1000);
  }
}

svc.on('install', function (error) {
  if (error) {
    console.log(chalk.red('Error al instalar el servicio:', error));
    logToFile(chalk.red('Error al instalar el servicio:', error)); // Colorear mensaje de error en rojo
    return;
  }

  console.log(chalk.blue('Servicio se ha instalado correctamente...')); // Colorear mensaje de información en azul

  svc.logOnAsDomain = process.env.DOMAIN;
  svc.logOnAsAccount = process.env.ACCOUNT;
  svc.logOnAsPassword = process.env.PASSWORD;

  const localUser = os.userInfo().username;

  if (
    localUser === process.env.ACCOUNT &&
    os.hostname() === process.env.DOMAIN
  ) {
    executeBatFile();
  } else {
    const errorMessage = `El usuario local (${localUser}) o el dominio (${os.hostname()}) no coinciden con las variables de entorno (${
      process.env.ACCOUNT
    }, ${process.env.DOMAIN}).`;
    logToFile(chalk.red(errorMessage)); // Colorear mensaje de error en rojo
    console.log(chalk.red(errorMessage)); // Colorear mensaje de error en rojo
  }
});

svc.on('uninstall', function (error) {
  if (error) {
    console.log(chalk.red('Error al desinstalar el servicio:', error));
    return;
  }

  console.log(chalk.blue('Servicio desinstalado.')); // Colorear mensaje de información en azul
});

if (process.argv[2] === 'install') {
  svc.install();
  console.log(chalk.green('Service installed.')); // Colorear mensaje de éxito en verde
  logToFile(chalk.green('Service installed.')); // Colorear mensaje de éxito en verde
} else if (process.argv[2] === 'uninstall') {
  svc.uninstall();
  console.log(chalk.green('Service uninstalled.')); // Colorear mensaje de éxito en verde
  logToFile(chalk.green('Service uninstalled.')); // Colorear mensaje de éxito en verde
} else {
  const errorMessage = `Error: Argumento no válido. Uso correcto: - Para instalar: node app.js install - Para desinstalar: node app.js uninstall`;
  console.log(chalk.red(errorMessage)); // Colorear mensaje de error en rojo
  logToFile(chalk.red(errorMessage)); // Colorear mensaje de error en rojo
}
