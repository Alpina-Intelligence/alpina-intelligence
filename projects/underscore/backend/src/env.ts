import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3001),
})

export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>
