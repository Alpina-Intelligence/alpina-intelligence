import {
	pgTable,
	text,
	integer,
	boolean,
	timestamp,
	index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Subset of puck-prophet tables used by the admin UI.
// Maintained separately to avoid cross-project import dependencies.
// ---------------------------------------------------------------------------

export const nhlSyncTaskConfig = pgTable("nhl_sync_task_config", {
	taskName: text("task_name").primaryKey(),
	enabled: boolean("enabled").default(true).notNull(),
	intervalLiveMs: integer("interval_live_ms").notNull(),
	intervalGamedayMs: integer("interval_gameday_ms").notNull(),
	intervalQuietMs: integer("interval_quiet_ms").notNull(),
	intervalOffseasonMs: integer("interval_offseason_ms").notNull(),
	batchSize: integer("batch_size"),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

export const nhlSyncLog = pgTable(
	"nhl_sync_log",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		taskName: text("task_name").notNull(),
		status: text("status").notNull(),
		durationMs: integer("duration_ms"),
		recordsUpserted: integer("records_upserted"),
		error: text("error"),
		startedAt: timestamp("started_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("nhl_sync_log_task_idx").on(table.taskName),
		index("nhl_sync_log_started_idx").on(table.startedAt),
	],
);

export const nhlEngineState = pgTable("nhl_engine_state", {
	id: integer("id").primaryKey().default(1),
	gameState: text("game_state").notNull().default("quiet"),
	startedAt: timestamp("started_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});
