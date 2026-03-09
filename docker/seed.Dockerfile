# ============================================================
# Helix Seed Runner — One-shot container for initial DB setup
# ============================================================

FROM node:22-alpine
WORKDIR /app

# Copy workspace manifests so npm installs deterministic workspace deps from
# the lockfile instead of doing ad-hoc package installs inside the container.
COPY package.json package-lock.json ./
COPY packages/prisma/package.json packages/prisma/
COPY packages/i18n/package.json packages/i18n/
COPY packages/constants/package.json packages/constants/
COPY packages/schemas/package.json packages/schemas/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
COPY packages/utils/package.json packages/utils/
COPY packages/hooks/package.json packages/hooks/
COPY apps/backend/package.json apps/backend/
COPY apps/web/package.json apps/web/

RUN npm ci

COPY tsconfig.base.json ./
COPY packages/prisma ./packages/prisma

# Generate Prisma client
RUN cd packages/prisma && npx prisma generate

CMD ["node", "--loader", "ts-node/esm", "packages/prisma/src/seeds/production-seed.ts"]
