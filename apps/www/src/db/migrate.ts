/**
 * Migration runner (ADR-0005): CI executes this as `<db>_migrator`, never a laptop
 * and never the app's `<db>_svc` role, which holds no DDL rights.
 *
 * Uses drizzle-orm's programmatic migrator rather than the drizzle-kit CLI: the CLI
 * exits 0 without applying when it cannot prompt, which is silent failure in CI.
 *
 *   DATABASE_URL="$(bws secret get $MIGRATOR_SECRET_ID | jq -r .value)" bun run db:migrate
 *
 * With no DATABASE_URL it targets the local stack (see ./env.ts).
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { pgDriverConfig } from "./env.ts";

const { url, ssl } = pgDriverConfig();
const client = postgres(url, { ssl, max: 1, fetch_types: false });

try {
	const target = new URL(url);
	console.log(
		`migrating ${target.pathname.slice(1)} at ${target.hostname} as ${decodeURIComponent(target.username)}`,
	);
	await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
	console.log("migrations applied");
} finally {
	await client.end();
}
