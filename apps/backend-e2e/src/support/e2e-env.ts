import { existsSync } from 'fs';
import { resolve } from 'path';
import { config as loadEnv } from 'dotenv';

const ENV_FILES = [
  resolve(__dirname, '../../.env.e2e.local'),
  resolve(__dirname, '../../.env.e2e'),
];

let envLoaded = false;

function loadE2eEnv(): void {
  if (envLoaded) return;

  for (const envFile of ENV_FILES) {
    if (existsSync(envFile)) {
      loadEnv({ path: envFile, override: false });
    }
  }

  envLoaded = true;
}

loadE2eEnv();

export const E2E_BACKEND_HOST = process.env.E2E_BACKEND_HOST ?? 'localhost';
export const E2E_BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT ?? '3003');
export const E2E_BASE_URL =
  process.env.E2E_BASE_URL ??
  `http://${E2E_BACKEND_HOST}:${E2E_BACKEND_PORT}`;
export const E2E_ADMIN_HOSTNAME =
  process.env.E2E_ADMIN_HOSTNAME ?? 'admin.helix.local';
export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? '';

export function getRequiredDatabaseUrl(): string {
  if (!E2E_DATABASE_URL) {
    throw new Error(
      'Missing database config for backend e2e. Set E2E_DATABASE_URL or DATABASE_URL in apps/backend-e2e/.env.e2e.local.'
    );
  }

  return E2E_DATABASE_URL;
}
