# syntax=docker/dockerfile:1.4

# ---------- Base Stage ----------
FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat curl dumb-init && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# ---------- Dependencies Stage ----------
FROM base AS deps
WORKDIR /app

COPY package*.json ./

# Use cache mount for npm to speed up builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production --legacy-peer-deps --prefer-offline

# ---------- Builder Stage ----------
FROM base AS builder
WORKDIR /app

COPY package*.json ./

# Install all deps with cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --prefer-offline

COPY . .

# Build with cache mount for Next.js
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# ---------- Production Runtime ----------
FROM base AS runner
WORKDIR /app

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]