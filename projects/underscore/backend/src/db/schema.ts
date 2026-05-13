import {
  doublePrecision,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth-schema.ts'
import { publicIdColumns, timestampColumns } from './columns.ts'

export * from './auth-schema.ts'

export const libraryEntryStatus = pgEnum('library_entry_status', [
  'queued',
  'reading',
  'finished',
  'abandoned',
])

export const books = pgTable('books', {
  ...publicIdColumns(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  language: text('language'),
  publishedYear: doublePrecision('published_year'),
  coverUrl: text('cover_url'),
  storageKey: text('storage_key').notNull().unique(),
  ...timestampColumns(),
})

export const libraryEntries = pgTable('library_entries', {
  ...publicIdColumns(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  bookId: uuid('book_id')
    .notNull()
    .references(() => books.id, { onDelete: 'cascade' }),
  status: libraryEntryStatus('status').notNull().default('queued'),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  ...timestampColumns(),
})

export const readingPositions = pgTable('reading_positions', {
  ...publicIdColumns(),
  libraryEntryId: uuid('library_entry_id')
    .notNull()
    .references(() => libraryEntries.id, { onDelete: 'cascade' }),
  cfi: text('cfi').notNull(),
  percentage: doublePrecision('percentage').notNull(),
  ...timestampColumns(),
})
