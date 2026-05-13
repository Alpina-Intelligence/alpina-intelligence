import { z } from 'zod'
import { publicIdSchema } from './books.ts'

export const readingPositionSchema = z.object({
  id: publicIdSchema,
  libraryEntryId: publicIdSchema,
  cfi: z.string().min(1),
  percentage: z.number().min(0).max(1),
  updatedAt: z.coerce.date(),
})

// id and updatedAt are DB-generated. libraryEntryId is typically the route param,
// so the body for POST/PUT is just the position itself.
export const readingPositionCreateInput = readingPositionSchema.pick({
  cfi: true,
  percentage: true,
})

export const readingPositionUpdateInput = readingPositionCreateInput.partial()

export type ReadingPosition = z.infer<typeof readingPositionSchema>
export type ReadingPositionCreateInput = z.infer<
  typeof readingPositionCreateInput
>
export type ReadingPositionUpdateInput = z.infer<
  typeof readingPositionUpdateInput
>
