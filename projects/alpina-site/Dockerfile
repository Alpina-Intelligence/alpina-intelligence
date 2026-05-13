# Build context: this project directory.
# Build: docker build -f projects/alpina-site/Dockerfile -t alpina-site projects/alpina-site
#
# TanStack Start with the Nitro node-server preset produces a self-contained
# bundle at .output/ that Bun can run directly — no node_modules at runtime.

FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["bun", ".output/server/index.mjs"]
