FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

EXPOSE 3000

# Wait for database, initialize it, then start Next.js dev server
CMD ["sh", "-c", "\
  npx tsx scripts/wait-for-db.ts && \
  npm run db:init || echo 'Warning: Database initialization had issues, but continuing...' && \
  npm run dev\
"]
