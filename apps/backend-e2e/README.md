# Backend E2E

Local-only admin API e2e suite for the backend.

## Run locally

1. Start the backend on `localhost:3003`.
2. Create `apps/backend-e2e/.env.e2e.local` with `E2E_DATABASE_URL=...` if the value is not already exported in your shell.
3. Run `npx nx run @org/backend-e2e:e2e`.

## Defaults

- `E2E_BASE_URL=http://localhost:3003`
- `E2E_ADMIN_HOSTNAME=admin.helix.local`
- `E2E_DATABASE_URL` is required

If backend is down or the database URL is missing, the suite fails during global setup with a direct error.
