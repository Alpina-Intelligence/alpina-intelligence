import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import {
  type Book,
  bookUpdateInput,
  publicIdSchema,
} from 'underscore-shared/schemas'
import { z } from 'zod'
import { db } from '../db/client.ts'
import { books } from '../db/schema.ts'
import { resolveStorageKey } from '../lib/storage.ts'
import { toWire } from '../lib/wire.ts'

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const idParamSchema = z.object({ id: publicIdSchema })

export const booksRoute = new Hono()
  .get('/', zValidator('query', listQuerySchema), async (c) => {
    const { limit } = c.req.valid('query')
    const rows = await db.select().from(books).limit(limit)
    return c.json({
      books: rows.map(toWire) as Array<Book>,
      limit,
    })
  })
  .get('/:id', zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param')
    const [row] = await db
      .select()
      .from(books)
      .where(eq(books.publicId, id))
      .limit(1)
    if (!row) return c.json({ error: 'not_found' }, 404)
    return c.json({ book: toWire(row) as Book })
  })
  // POST removed pending an upload flow — books are created via
  // `bun run seed:books` which sets storage_key from a local file.
  .patch(
    '/:id',
    zValidator('param', idParamSchema),
    zValidator('json', bookUpdateInput),
    async (c) => {
      const { id } = c.req.valid('param')
      const input = c.req.valid('json')
      const [row] = await db
        .update(books)
        .set(input)
        .where(eq(books.publicId, id))
        .returning()
      if (!row) return c.json({ error: 'not_found' }, 404)
      return c.json({ book: toWire(row) as Book })
    },
  )
  .delete('/:id', zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param')
    const [row] = await db
      .delete(books)
      .where(eq(books.publicId, id))
      .returning({ id: books.publicId })
    if (!row) return c.json({ error: 'not_found' }, 404)
    return c.json({ deleted: row.id })
  })
  .get('/:id/file', zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param')
    const [row] = await db
      .select({ storageKey: books.storageKey })
      .from(books)
      .where(eq(books.publicId, id))
      .limit(1)
    if (!row) return c.json({ error: 'not_found' }, 404)
    const file = Bun.file(resolveStorageKey(row.storageKey))
    if (!(await file.exists())) {
      return c.json({ error: 'file_missing' }, 404)
    }
    return new Response(file, {
      headers: {
        'Content-Type': 'application/epub+zip',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(file.size),
      },
    })
  })
