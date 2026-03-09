# ============================================================
# Helix B2C Storefront — Multi-stage Docker Build (Next.js Standalone)
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
COPY apps/b2c-storefront/package.json apps/b2c-storefront/

RUN npm ci

# ── Stage 2: Build Next.js ─────────────────────────────────
FROM deps AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .

# Build Next.js with standalone output
RUN npx nx build @org/b2c-storefront

# ── Stage 3: Production runtime ────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone server (includes only required node_modules)
COPY --from=builder /app/apps/b2c-storefront/.next/standalone ./
# Copy static assets
COPY --from=builder /app/apps/b2c-storefront/.next/static ./apps/b2c-storefront/.next/static
# Copy public folder (if exists)
COPY --from=builder /app/apps/b2c-storefront/public ./apps/b2c-storefront/public

USER nextjs

EXPOSE 3200
ENV PORT=3200
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/b2c-storefront/server.js"]
