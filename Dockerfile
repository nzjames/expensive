# --- Build stage ---
# syntax=docker/dockerfile:1.6

ARG TARGETPLATFORM

# Build dependencies for the target app using a fresh resolution
# This avoids npm optional-deps bugs across architectures (e.g. Rollup prebuilds)
FROM node:22-slim AS builder
WORKDIR /app
ENV NODE_ENV=development

# Resolve dev dependencies inside the container for the current platform
# Intentionally avoid package-lock.json here to allow correct opt-deps selection
COPY package.json ./
RUN npm install

COPY . .
# Ensure SvelteKit internals are synced after sources are available
RUN npm run prepare && npm run build

# --- Runtime stage ---
FROM --platform=${TARGETPLATFORM} node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install production deps (includes better-sqlite3)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy built server, migrations, and runtime scripts
COPY --from=builder /app/build ./build
COPY --from=builder /app/.drizzle ./.drizzle
COPY --from=builder /app/scripts ./scripts

# Run as non-root
USER node

# Default runtime env
ENV PORT=3000
ENV DATABASE_URL=/data/expense-prod.db

EXPOSE 3000

# Run migrations then start server
CMD ["sh", "-lc", "node scripts/migrate.js && node build"]
