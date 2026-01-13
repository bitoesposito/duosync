FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy only package files for dependency installation
# Source code will be mounted as volume in docker-compose.yml
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Expose port 3000
EXPOSE 3000

# Run Next.js in development mode
# Source code is mounted from host via volume
CMD ["pnpm", "run", "dev"]
