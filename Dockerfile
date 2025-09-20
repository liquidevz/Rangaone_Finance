# ---------- Base image ----------
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies needed for building Next.js
RUN apk add --no-cache libc6-compat

# ---------- Dependencies ----------
FROM base AS deps
# Copy only package files for caching
COPY package*.json ./
# Install dependencies
RUN npm ci --legacy-peer-deps

# ---------- Builder ----------
FROM base AS builder
WORKDIR /app
# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules
# Copy app source
COPY . .
# Build Next.js app
RUN npm run build

# ---------- Production Runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

# Add non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy production files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package*.json ./

# Fix permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
