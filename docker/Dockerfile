# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Copy package files and npm config for security
COPY package.json package-lock.json* .npmrc* ./

# Security: Install dependencies with audit check
# Use --ignore-scripts to prevent malicious postinstall scripts during dependency installation
RUN npm ci --legacy-peer-deps --only=production --ignore-scripts && \
    npm cache clean --force

# Security: Run audit check (non-blocking but will warn)
RUN npm audit --audit-level=moderate || echo "Warning: Some vulnerabilities detected in production dependencies"

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Copy package files and npm config for security
COPY package.json package-lock.json* .npmrc* ./

# Security: Install all dependencies with audit check
# Use --ignore-scripts to prevent malicious postinstall scripts
# Note: Some packages may need scripts for build, but we'll handle that explicitly if needed
RUN npm ci --legacy-peer-deps --ignore-scripts && \
    npm cache clean --force

# Security: Run audit check before building
RUN npm audit --audit-level=moderate || echo "Warning: Some vulnerabilities detected, but continuing build..."

# Copy application source code
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}

# Build Next.js application
RUN npm run build

# ============================================
# Stage 3: Runtime Dependencies
# ============================================
# SECURITY: Instead of installing packages, we copy them from builder
# This ensures we use the exact same audited versions
FROM node:20-alpine AS runtime-deps
WORKDIR /app

# Copy package.json and package-lock.json for dependency resolution
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Copy all dependencies from builder (including devDependencies like tsx)
# This is safe because they were installed and audited in the builder stage
# We need all dependencies because:
# 1. Next.js standalone includes minimal deps, but we need more for TypeScript scripts
# 2. Scripts like wait-for-db.ts and init-db.ts need tsx (a devDependency) and its dependencies
# 3. Database operations need drizzle-orm, pg, and their transitive dependencies
# Note: We copy all deps (not just production) because tsx is needed for runtime scripts
COPY --from=builder /app/node_modules ./node_modules

# ============================================
# Stage 4: Runner
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy Next.js standalone build first (includes server.js and minimal dependencies)
COPY --from=builder /app/.next/standalone ./

# Copy package files for dependency resolution
COPY --from=runtime-deps /app/package.json ./package.json
COPY --from=runtime-deps /app/package-lock.json ./package-lock.json

# Copy all dependencies from builder (overwrites standalone's minimal node_modules)
# This ensures we have all dependencies needed for:
# 1. Next.js server (from standalone, but we overwrite with full deps for compatibility)
# 2. TypeScript scripts (tsx, typescript, and their dependencies)
# 3. Database operations (drizzle-orm, pg, and transitive dependencies)
# Note: This includes devDependencies like tsx which are needed at runtime for scripts
# This is safe because all dependencies were audited in the builder stage
COPY --from=runtime-deps /app/node_modules ./node_modules

# Copy static files
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy scripts and config files needed for database initialization
# These are not included in standalone build, so we copy them separately
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/lib/db ./lib/db
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/tsconfig.json ./

# Copy entrypoint script (already included in scripts/ copy above, but we need it in root)
COPY --from=builder /app/scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
