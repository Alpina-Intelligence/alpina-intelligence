/**
 * Drizzle schema — drizzle-orm 0.45.x (stable). Mind the AGENTS.md gotcha:
 * this is the 0.x API surface; the docs' main pages describe 1.0.
 */
import {
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const posts = pgTable(
	"posts",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		slug: text("slug").notNull(),
		title: text("title").notNull(),
		summary: text("summary").notNull(),
		body: text("body").notNull(),
		readMinutes: integer("read_minutes").notNull().default(1),
		// timestamptz always: naive timestamps store the process's wall clock
		// (the same failure the TZ=UTC Dockerfile rule guards against).
		publishedAt: timestamp("published_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [uniqueIndex("posts_slug_idx").on(t.slug)],
);
