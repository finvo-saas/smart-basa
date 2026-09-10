# syntax=docker/dockerfile:1
# Smart Living frontend — Next.js standalone production image
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public env. Browser uses NEXT_PUBLIC_API_URL (api subdomain in prod).
# SSR uses API_INTERNAL_URL at runtime (see docker-compose).
ARG NEXT_PUBLIC_SITE_URL=https://localhost
ARG NEXT_PUBLIC_API_URL=https://api.localhost/api/v1
ARG API_PROXY_TARGET=http://api:8000
ARG NEXT_PUBLIC_STORAGE_CDN_HOST=

ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    API_PROXY_TARGET=$API_PROXY_TARGET \
    NEXT_PUBLIC_STORAGE_CDN_HOST=$NEXT_PUBLIC_STORAGE_CDN_HOST

RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    API_INTERNAL_URL=http://api:8000/api/v1

RUN useradd --create-home --uid 10001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
