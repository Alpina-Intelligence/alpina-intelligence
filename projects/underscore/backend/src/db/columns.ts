import { sql } from 'drizzle-orm'
import { text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { v7 as uuidv7 } from 'uuid'

export const PUBLIC_ID_LENGTH = 12

export const internalIdColumns = () => ({
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
})

export const publicIdColumns = () => ({
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  publicId: text('public_id')
    .notNull()
    .unique()
    .$defaultFn(() => nanoid(PUBLIC_ID_LENGTH)),
})

export const timestampColumns = () => ({
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`)
    .$onUpdate(() => new Date()),
})
