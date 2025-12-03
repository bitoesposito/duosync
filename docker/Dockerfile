FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (use npm install to ensure all dependencies are installed)
RUN npm ci --legacy-peer-deps || npm install

EXPOSE 3000

# Wait for database, initialize it, then start Next.js dev server
# Note: Application files are mounted as volumes in docker-compose.yml
# Install dependencies if node_modules is missing (can happen with volume mounts)
CMD ["sh", "-c", "\
  if [ ! -d 'node_modules/cmdk' ]; then \
    echo 'Installing missing dependencies...' && \
    npm ci --legacy-peer-deps || npm install; \
  fi && \
  npx tsx scripts/wait-for-db.ts && \
  npm run db:init || echo 'Warning: Database initialization had issues, but continuing...' && \
  npm run dev\
"]
