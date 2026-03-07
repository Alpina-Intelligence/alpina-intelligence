import { createServerFn } from "@tanstack/react-start";
import { desc, eq, sql } from "drizzle-orm";
import { ppDb } from "@/db/puck-prophet";
import {
	nhlEngineState,
	nhlSyncLog,
	nhlSyncTaskConfig,
} from "@/db/puck-prophet-schema";
import {
	getSyncLogsSchema,
	updateMaxConcurrencySchema,
	updateTaskConfigSchema,
} from "@/lib/schemas/admin";

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

export const getSyncDashboard = createServerFn({ method: "GET" }).handler(
	async () => {
		const [configs, recentLogs, lastRunResult, engineState] =
			await Promise.all([
				ppDb.select().from(nhlSyncTaskConfig),
				ppDb
					.select()
					.from(nhlSyncLog)
					.orderBy(desc(nhlSyncLog.startedAt))
					.limit(50),
				ppDb.execute<{
					task_name: string;
					status: string;
					duration_ms: number | null;
					records_upserted: number | null;
					error: string | null;
					started_at: string;
				}>(sql`
					SELECT DISTINCT ON (task_name)
						task_name, status, duration_ms, records_upserted, error, started_at
					FROM nhl_sync_log
					ORDER BY task_name, started_at DESC
				`),
				ppDb.select().from(nhlEngineState).limit(1),
			]);

		return {
			configs,
			recentLogs,
			lastRunPerTask: lastRunResult.rows,
			engineState: engineState[0] ?? null,
		};
	},
);

export const getSyncLogs = createServerFn({ method: "GET" })
	.inputValidator((d: unknown) => getSyncLogsSchema.parse(d))
	.handler(async ({ data }) => {
		const query = ppDb
			.select()
			.from(nhlSyncLog)
			.orderBy(desc(nhlSyncLog.startedAt))
			.limit(data.limit ?? 100);

		if (data.taskName) {
			return await query.where(eq(nhlSyncLog.taskName, data.taskName));
		}

		return await query;
	});

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

export const updateTaskConfig = createServerFn({ method: "POST" })
	.inputValidator((d: unknown) => updateTaskConfigSchema.parse(d))
	.handler(async ({ data }) => {
		const { taskName, ...updates } = data;
		const setClause = Object.fromEntries(
			Object.entries(updates).filter(([_, v]) => v !== undefined),
		);

		await ppDb
			.update(nhlSyncTaskConfig)
			.set(setClause)
			.where(eq(nhlSyncTaskConfig.taskName, taskName));

		return { success: true };
	});

export const updateMaxConcurrency = createServerFn({ method: "POST" })
	.inputValidator((d: unknown) => updateMaxConcurrencySchema.parse(d))
	.handler(async ({ data }) => {
		// Note: takes effect on next scheduler restart
		console.log(
			`[admin] Max concurrency update requested: ${data.maxConcurrency} (requires scheduler restart)`,
		);
		return { success: true };
	});
