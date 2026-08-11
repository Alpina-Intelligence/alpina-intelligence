/**
 * DB client singleton. postgres-js driver: works under Bun (dev) and Node
 * (deployed nitro output) alike. Import ONLY from server code — loaders'
 * server functions, server routes — never from components.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { databaseUrl } from "./env.ts";
import * as schema from "./schema.ts";

const client = postgres(databaseUrl(), {
	// The local role has a connection limit in prod parity spirit; keep the
	// pool modest — one dev server never needs more.
	max: 10,
});

export const db = drizzle(client, { schema });
export { schema };
