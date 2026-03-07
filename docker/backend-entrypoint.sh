#!/bin/sh
set -e

echo "[entrypoint] Running Prisma migrations..."
cd /app/packages/prisma
/app/node_modules/.bin/prisma migrate deploy
echo "[entrypoint] Migrations complete."

cd /app
exec node dist/main.js
