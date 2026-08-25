/**
 * Per-request DB access (ADR-0005 §7). Import ONLY from server code — server
 * functions, route loaders, server routes — never from components.
 *
 * The client is built per request, on purpose. Cloudflare: *"Hyperdrive maintains
 * the underlying database connection pool, so creating a new client on each request
 * is fast and recommended."* A module-scope `postgres()` singleton is the
 * anti-pattern — the pool lives in Hyperdrive, and a socket opened in one request's
 * I/O context is not reusable by the next.
 *
 * The three options are Cloudflare's, not preferences:
 *   max: 5            — Workers' cap on concurrent external connections
 *   fetch_types: false — drops a round-trip; we use no array types
 *   prepare: true      — false makes Hyperdrive skip prepared-statement caching
 *
 * Tier-blind: `env.HYPERDRIVE.connectionString` is the only source, in dev and
 * deployed alike. Locally the binding is fed by
 * CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE (see .envrc), so there
 * is no branch on environment anywhere in this file. Note the string Hyperdrive
 * hands the Worker carries no libpq SSL params — TLS to the origin is Hyperdrive's
 * job — so the ./env.ts adapter is for drizzle-kit/psql only, not here.
 */
import { env } from "cloudflare:workers";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

export { schema };

export type Db = PostgresJsDatabase<typeof schema>;

/**
 * Run `fn` against a request-scoped client, then release it.
 *
 * The close is deliberately not awaited: the response should not wait on socket
 * teardown, and the isolate reclaims it either way. Errors propagate to the
 * caller, so a failed query still releases the connection.
 */
export async function withDb<T>(fn: (db: Db) => Promise<T>): Promise<T> {
	const client = postgres(env.HYPERDRIVE.connectionString, {
		max: 5,
		fetch_types: false,
		prepare: true,
	});
	try {
		return await fn(drizzle(client, { schema }));
	} finally {
		void client.end({ timeout: 5 }).catch(() => {});
	}
}
