# ============================================================
# Helix Backend — Multi-stage Docker Build
# ============================================================
# Build: webpack bundles NestJS into a single dist/main.js
# Runtime: Node.js + bundle + Prisma engine + native modules
# ============================================================

# ── Stage 1: Install ALL dependencies ──────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Copy workspace root + all package.json files for npm workspaces
COPY package.json package-lock.json ./
COPY packages/prisma/package.json packages/prisma/
COPY packages/i18n/package.json packages/i18n/
COPY packages/constants/package.json packages/constants/
COPY packages/schemas/package.json packages/schemas/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
COPY packages/utils/package.json packages/utils/
COPY apps/backend/package.json apps/backend/
COPY apps/web/package.json apps/web/

RUN npm ci

# ── Stage 2: Generate Prisma Client ───────────────────────
FROM deps AS prisma
COPY tsconfig.base.json ./
COPY packages/prisma/prisma ./packages/prisma/prisma
COPY packages/prisma/prisma.config.ts packages/prisma/
COPY packages/prisma/tsconfig*.json packages/prisma/
COPY packages/prisma/src packages/prisma/src
RUN cd packages/prisma && npx prisma generate

# ── Stage 3: Build backend with webpack ───────────────────
FROM prisma AS builder
COPY . .
RUN npx nx build @org/backend

# ── Stage 4: Production runtime ───────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the webpack bundle (self-contained JS + i18n assets)
COPY --from=builder /app/apps/backend/dist ./dist

# Copy node_modules from builder (includes native modules + workspace deps)
COPY --from=builder /app/node_modules ./node_modules

# Copy workspace packages (needed for @org/* symlink resolution at runtime)
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json

# Copy entrypoint script
COPY docker/backend-entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["/app/entrypoint.sh"]
