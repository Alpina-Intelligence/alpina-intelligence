import { z } from 'zod'
import { publicIdSchema } from './books.ts'

export const libraryEntryStatusSchema = z.enum([
  'queued',
  'reading',
  'finished',
  'abandoned',
])

export type LibraryEntryStatus = z.infer<typeof libraryEntryStatusSchema>

export const libraryEntrySchema = z.object({
  id: publicIdSchema,
  bookId: publicIdSchema,
  status: libraryEntryStatusSchema,
  createdAt: z.coerce.date(),
  finishedAt: z.coerce.date().optional(),
})

// userId comes from the authenticated session, not the request body or wire shape.
// id and createdAt are DB-generated.
export const libraryEntryCreateInput = libraryEntrySchema
  .omit({ id: true, createdAt: true })
  .extend({ status: libraryEntryStatusSchema.optional() })

export const libraryEntryUpdateInput = libraryEntrySchema
  .pick({ status: true, finishedAt: true })
  .partial()

export type LibraryEntry = z.infer<typeof libraryEntrySchema>
export type LibraryEntryCreateInput = z.infer<typeof libraryEntryCreateInput>
export type LibraryEntryUpdateInput = z.infer<typeof libraryEntryUpdateInput>
