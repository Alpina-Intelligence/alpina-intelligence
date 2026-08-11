/**
 * Drizzle schema — drizzle-orm 0.45.x (stable). Mind the AGENTS.md gotcha:
 * this is the 0.x API surface; the docs' main pages describe 1.0.
 *
 * Identifier discipline (src/lib/ids.ts, from oraq ADR-0034): UUIDv7 text PK
 * minted app-side ($defaultFn), never shown in URLs; `public_id` is the
 * stable external name; `slug` is the editorial, SEO-facing URL — mutable.
 */
import {
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { newId, newPublicId } from "#/lib/ids.ts";

export const posts = pgTable(
	"posts",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => newId()),
		publicId: text("public_id")
			.notNull()
			.$defaultFn(() => newPublicId("post")),
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
	(t) => [
		uniqueIndex("posts_slug_idx").on(t.slug),
		uniqueIndex("posts_public_id_idx").on(t.publicId),
	],
);
