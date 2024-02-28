import dotenv from 'dotenv';
import { request as _request } from 'https';
import streamConsumers from 'stream/consumers';

import { logToFile } from './logToFile.js';

dotenv.config();

const url = process.env.URL;

async function checkStatus() {
  return new Promise((resolve, reject) => {
    const request = _request(url, async (response) => {
      const statusCode = response.statusCode;
      logToFile(`Código de estado: ${statusCode}`);
      console.log(`Código de estado: ${statusCode}`);

      if (statusCode === 200) {
        const body = await streamConsumers(response);
        console.log(`Cuerpo de la respuesta: ${body}`);
      }

      resolve(statusCode);
    });

    request.on('error', (err) => {
      console.error('Ocurrió un error al intentar acceder a la URL:', err);
      reject(err);
    });

    request.end();
  });
}

export default checkStatus;