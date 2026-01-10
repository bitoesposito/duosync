FROM node:20-alpine

WORKDIR /app

# Security: Create non-root user early
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy package files and npm config for security
COPY package.json package-lock.json* .npmrc* ./

# Security: Install dependencies with audit and no scripts
# Use --ignore-scripts to prevent malicious postinstall scripts
# This is safe because we only need dependencies, not their install scripts
RUN npm ci --legacy-peer-deps --ignore-scripts && \
    npm cache clean --force

# Security: Run npm audit to check for known vulnerabilities
RUN npm audit --audit-level=moderate || echo "Warning: Some vulnerabilities detected, but continuing build..."

EXPOSE 3000

# Wait for database, initialize it, then start Next.js dev server
# Note: Application files are mounted as volumes in docker-compose.yml
# SECURITY: Do NOT install dependencies at runtime - this is a major security risk
# If node_modules is missing, the container should fail rather than installing potentially compromised packages
CMD ["sh", "-c", "\
  if [ ! -d 'node_modules' ] || [ ! -f 'node_modules/.package-lock.json' ]; then \
    echo 'ERROR: node_modules missing or corrupted. Rebuild the container instead of installing at runtime.' && \
    exit 1; \
  fi && \
  npx tsx scripts/wait-for-db.ts && \
  npm run db:init || echo 'Warning: Database initialization had issues, but continuing...' && \
  npm run dev\
"]
