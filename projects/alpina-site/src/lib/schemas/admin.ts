import { z } from "zod";

export const updateTaskConfigSchema = z.object({
	taskName: z.string(),
	enabled: z.boolean().optional(),
	intervalLiveMs: z.number().positive().optional(),
	intervalGamedayMs: z.number().positive().optional(),
	intervalQuietMs: z.number().positive().optional(),
	intervalOffseasonMs: z.number().positive().optional(),
	batchSize: z.number().int().positive().nullable().optional(),
});
export type UpdateTaskConfigData = z.infer<typeof updateTaskConfigSchema>;

export const updateMaxConcurrencySchema = z.object({
	maxConcurrency: z.number().int().positive(),
});

export const getSyncLogsSchema = z.object({
	taskName: z.string().optional(),
	limit: z.number().int().positive().optional(),
});
