# ---------- Multi-stage Production Dockerfile ----------

# Base image with security updates
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    libc6-compat \
    curl \
    dumb-init && \
    rm -rf /var/cache/apk/*

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user early
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# ---------- Dependencies Stage ----------
FROM base AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies with clean install
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# ---------- Builder Stage ----------
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Install all dependencies including dev dependencies for build
RUN npm ci --legacy-peer-deps

# Build the application
RUN npm run build

# ---------- Production Runtime ----------
FROM base AS runner

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy only production node_modules
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy package.json for reference
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# Create health check endpoint script
RUN echo '#!/bin/sh\ncurl -f http://localhost:3000/api/health || curl -f http://localhost:3000/ || exit 1' > /app/healthcheck.sh && \
    chmod +x /app/healthcheck.sh && \
    chown nextjs:nodejs /app/healthcheck.sh

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD /app/healthcheck.sh

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]