import dotenv from 'dotenv';
import { request as _request } from 'https';
import { pipeline, Writable } from 'stream'; // Import the pipeline function and Writable class from the stream module

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
        let body = '';
        // Create a writable stream to receive the data from the response stream
        const writableStream = new Writable({
          write(chunk, encoding, callback) {
            body += chunk.toString();
            callback();
          },
        });

        // Use the pipeline function to pipe the response stream to the writable stream
        pipeline(response, writableStream, (err) => {
          if (err) {
            console.error(
              'Ocurrió un error al leer el cuerpo de la respuesta:',
              err
            );
            reject(err);
          } else {
            console.log(`Cuerpo de la respuesta: ${body}`);
          }
        });
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
