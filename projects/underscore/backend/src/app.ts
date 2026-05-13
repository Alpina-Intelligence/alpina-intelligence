import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './lib/auth.ts'
import { booksRoute } from './routes/books.ts'
import { healthRoute } from './routes/health.ts'

export const app = new Hono()
  .use(
    '*',
    cors({
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
    }),
  )
  .on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))
  .route('/health', healthRoute)
  .route('/books', booksRoute)

export type AppType = typeof app
