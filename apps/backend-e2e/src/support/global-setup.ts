import { Socket } from 'net';
import {
  E2E_BACKEND_HOST,
  E2E_BACKEND_PORT,
  E2E_BASE_URL,
  getRequiredDatabaseUrl,
} from './e2e-env.js';

/* eslint-disable */
var __TEARDOWN_MESSAGE__: string;

async function assertBackendReachable(
  host: string,
  port: number
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const socket = new Socket();

    socket.setTimeout(1000);

    socket.once('connect', () => {
      socket.destroy();
      resolve();
    });

    socket.once('timeout', () => {
      socket.destroy();
      reject(
        new Error(
          `Backend e2e could not reach ${host}:${port}. Start the backend locally before running tests.`
        )
      );
    });

    socket.once('error', () => {
      socket.destroy();
      reject(
        new Error(
          `Backend e2e could not connect to ${host}:${port}. Expected local backend at ${E2E_BASE_URL}.`
        )
      );
    });

    socket.connect(port, host);
  });
}

module.exports = async function () {
  console.log(`\nSetting up backend e2e against ${E2E_BASE_URL}...\n`);

  getRequiredDatabaseUrl();
  await assertBackendReachable(E2E_BACKEND_HOST, E2E_BACKEND_PORT);

  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down backend e2e...\n';
};
