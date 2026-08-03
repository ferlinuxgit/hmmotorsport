FROM node:24.13.1-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json* .npmrc ./
COPY vendor ./vendor
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24.13.1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=builder /app/scripts/maintenance.mjs ./scripts/maintenance.mjs
COPY --from=builder /app/scripts/run-jobs.mjs ./scripts/run-jobs.mjs
COPY --from=deps /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps /app/node_modules/postgres ./node_modules/postgres
RUN mkdir -p /app/.data/uploads && chown -R node:node /app/.data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -qO- "http://127.0.0.1:${PORT}/api/live" >/dev/null 2>&1 || exit 1

USER node

CMD ["sh", "-c", "if [ \"${RUN_MIGRATIONS:-true}\" = \"true\" ]; then node scripts/migrate.mjs; fi && node server.js"]
