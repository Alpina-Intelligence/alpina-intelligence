FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# Production image
FROM oven/bun:1-slim

WORKDIR /app

# Copy built output
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]
