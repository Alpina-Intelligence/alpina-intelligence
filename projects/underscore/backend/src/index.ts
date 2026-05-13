import { app } from './app.ts'
import { env } from './env.ts'

const server = Bun.serve({
  fetch: app.fetch,
  port: env.PORT,
})

console.log(`underscore-backend listening on http://localhost:${server.port}`)
