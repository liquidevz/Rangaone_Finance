# syntax=docker/dockerfile:1.4

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat curl dumb-init

# Dependencies
FROM base AS deps
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production --legacy-peer-deps --prefer-offline --no-audit

# Builder
FROM base AS builder
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --prefer-offline --no-audit
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production NODE_OPTIONS="--max-old-space-size=2048"
RUN --mount=type=cache,target=/app/.next/cache npm run build

# Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME="0.0.0.0"
RUN apk add --no-cache curl dumb-init && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    rm -rf /var/cache/apk/*

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]