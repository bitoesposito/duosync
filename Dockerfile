# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps || npm install

# Copy application source code
COPY . .

# Build the Next.js application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --legacy-peer-deps --omit=dev || npm install --production --legacy-peer-deps

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/types ./types
COPY --from=builder /app/app ./app
COPY --from=builder /app/components ./components
COPY --from=builder /app/features ./features
COPY --from=builder /app/hooks ./hooks
COPY --from=builder /app/i18n ./i18n
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/postcss.config.* ./
COPY --from=builder /app/drizzle.config.ts ./

# Install tsx globally for running scripts
RUN npm install -g tsx

EXPOSE 3000

# Wait for database, initialize it, then start Next.js production server
CMD ["sh", "-c", "\
  npx tsx scripts/wait-for-db.ts && \
  npm run db:init || echo 'Warning: Database initialization had issues, but continuing...' && \
  npm start\
"]
