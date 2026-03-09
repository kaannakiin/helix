# ============================================================
# Helix Storefront Router — Multi-stage Docker Build
# ============================================================
# Build: esbuild compiles Fastify app to dist/
# Runtime: Node.js + compiled JS + production dependencies
# ============================================================

# ── Stage 1: Install ALL dependencies ──────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

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
COPY apps/portal/package.json apps/portal/
COPY apps/storefront-router/package.json apps/storefront-router/

RUN npm ci

# ── Stage 2: Build with esbuild ─────────────────────────────
FROM deps AS builder
WORKDIR /app

COPY . .

RUN npx nx build @org/storefront-router

# ── Stage 3: Production runtime ─────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the esbuild output
COPY --from=builder /app/apps/storefront-router/dist ./dist

# Copy node_modules (needed for fastify, http-proxy, ioredis)
COPY --from=builder /app/node_modules ./node_modules

# Copy package.json for module resolution
COPY --from=builder /app/apps/storefront-router/package.json ./package.json

EXPOSE 3100
ENV PORT=3100

CMD ["node", "dist/main.js"]
