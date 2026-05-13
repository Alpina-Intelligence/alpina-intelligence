# Build context: projects/underscore (the nested workspace root).
# Build: docker build -f projects/underscore/backend/Dockerfile -t underscore-backend projects/underscore
#
# We `bun build` the entry into a single self-contained file so the runtime
# image carries no node_modules — drops the image from ~850MB to ~100MB.

FROM oven/bun:1-alpine AS builder
WORKDIR /repo
COPY package.json bun.lock ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN bun install --frozen-lockfile --ignore-scripts

COPY shared ./shared
COPY backend ./backend

WORKDIR /repo/backend
RUN bun build src/index.ts --target=bun --outfile=/app/server.js

FROM oven/bun:1-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/server.js ./
EXPOSE 3001
CMD ["bun", "server.js"]
