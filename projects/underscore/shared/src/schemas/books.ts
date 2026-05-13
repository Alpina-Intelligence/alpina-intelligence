import { z } from 'zod'

export const PUBLIC_ID_LENGTH = 12
export const publicIdSchema = z.string().length(PUBLIC_ID_LENGTH)

export const bookSchema = z.object({
  id: publicIdSchema,
  title: z.string().min(1),
  author: z.string().min(1),
  language: z.string().optional(),
  publishedYear: z.number().int().optional(),
  coverUrl: z.url().optional(),
  createdAt: z.coerce.date(),
})

export const bookCreateInput = bookSchema.omit({ id: true, createdAt: true })
export const bookUpdateInput = bookCreateInput.partial()

export type Book = z.infer<typeof bookSchema>
export type BookCreateInput = z.infer<typeof bookCreateInput>
export type BookUpdateInput = z.infer<typeof bookUpdateInput>
