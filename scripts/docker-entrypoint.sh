#!/bin/sh
set -e

echo "Starting DuoSync production container..."

# Wait for database to be ready
echo "Waiting for database connection..."
tsx scripts/wait-for-db.ts

# Initialize database schema if needed
echo "Initializing database..."
tsx scripts/init-db.ts || echo "Warning: Database initialization had issues, but continuing..."

# Start Next.js server
echo "Starting Next.js server..."
exec "$@"

