# ---------- Base image ----------
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies needed for building Next.js
RUN apk add --no-cache libc6-compat

# ---------- Dependencies ----------
FROM base AS deps
# Copy only package files for better caching
COPY package*.json ./
# Install dependencies
RUN npm ci --legacy-peer-deps

# ---------- Builder ----------
FROM base AS builder
WORKDIR /app
# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the source code
COPY . .
# Build Next.js app
RUN npm run build

# ---------- Runner / Production ----------
FROM base AS runner
WORKDIR /app

# Create user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built artifacts from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./ 
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Pre-create and assign ownership of prerender cache
RUN mkdir -p .next && chown -R nextjs:nodejs .next

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
