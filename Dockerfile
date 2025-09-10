# --- Build stage ---
FROM node:22-slim AS builder
WORKDIR /app
ENV NODE_ENV=development

COPY package.json package-lock.json ./
RUN npm ci || npm install

COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:22-slim AS runner
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
