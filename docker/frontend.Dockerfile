# ============================================================
# Helix Frontend — Multi-stage Docker Build (Next.js Standalone)
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
COPY apps/backend/package.json apps/backend/
COPY apps/web/package.json apps/web/

RUN npm ci

# ── Stage 2: Build Next.js ─────────────────────────────────
FROM deps AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .

# Prisma generate needed for type resolution during build
RUN cd packages/prisma && npx prisma generate

# Build Next.js with standalone output
RUN npx nx build @org/web

# ── Stage 3: Production runtime ────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone server (includes only required node_modules)
COPY --from=builder /app/apps/web/.next/standalone ./
# Copy static assets
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
# Copy public folder (if exists)
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
