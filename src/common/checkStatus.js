import dotenv from 'dotenv';
import { request as _request } from 'https';
import { pipeline, Writable } from 'stream';

import { logToFile } from './logToFile.js';

dotenv.config();

const url = process.env.URL;

async function checkStatus() {
  try {
    const response = await makeRequest(url); // Make the request and get the response
    const statusCode = response.statusCode;
    logToFile(`Código de estado: ${statusCode}`);
    console.log(`Código de estado: ${statusCode}`);

    if (statusCode === 200) {
      const body = await getResponseBody(response); // Get the response body
      console.log(`Cuerpo de la respuesta: ${body}`);
    }

    return statusCode;
  } catch (error) {
    console.error('Ocurrió un error:', error);
    throw error;
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = _request(url, (response) => {
      resolve(response);
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.end();
  });
}

function getResponseBody(response) {
  return new Promise((resolve, reject) => {
    let body = '';

    const writableStream = new Writable({
      write(chunk, encoding, callback) {
        body += chunk.toString();
        callback();
      },
    });

    pipeline(response, writableStream, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

export default checkStatus;
