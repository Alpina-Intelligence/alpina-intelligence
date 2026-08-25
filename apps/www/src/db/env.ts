/**
 * Server-only DB connection settings for **tooling** — drizzle-kit migrations and
 * one-off admin runs. The deployed app does NOT use this file: it reads
 * `env.HYPERDRIVE.connectionString` (see ./index.ts, ADR-0005 §7).
 *
 * Two shapes, deliberately:
 *  - `databaseUrl()` is the canonical libpq form, exactly as stored in Bitwarden
 *    (`?sslmode=verify-full&sslrootcert=system`). Correct for `psql` by default.
 *  - `pgDriverConfig()` adapts that for postgres-js, which parses URLs itself and
 *    forwards unknown query params as Postgres *runtime* parameters — so a libpq
 *    `sslrootcert=system` becomes `SET sslrootcert` and fails with
 *    `42704 unrecognized configuration parameter`. Strip them, pass `ssl` instead.
 *
 * PGPASSWORD single source (local): infra/local/.env.local. Read as a FALLBACK
 * when the var isn't already set, so `docker compose --env-file`, drizzle-kit and
 * `psql` all agree without a second copy in apps/www/.env.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function localEnvPassword(): string | undefined {
	// apps/www/src/db → repo root is three up.
	const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
	const file = resolve(root, "infra/local/.env.local");
	if (!existsSync(file)) return undefined;
	for (const line of readFileSync(file, "utf8").split("\n")) {
		const m = line.match(/^PGPASSWORD=(.*)$/);
		if (m) return m[1];
	}
	return undefined;
}

export function databaseUrl(): string {
	// CI and one-off admin runs (ADR-0005): a single full URL, fetched from
	// Bitwarden at run time. Takes precedence over the libpq parts below, which
	// only ever describe the local stack. The app itself uses neither — it reads
	// env.HYPERDRIVE.connectionString (see ./index.ts).
	const explicit = process.env.DATABASE_URL;
	if (explicit) return explicit;

	const host = process.env.PGHOST ?? "127.0.0.1";
	const port = process.env.PGPORT ?? "5434";
	const db = process.env.PGDATABASE ?? "www";
	const user = process.env.PGUSER ?? "www_svc";
	const password = process.env.PGPASSWORD ?? localEnvPassword();
	if (!password) {
		throw new Error(
			"PGPASSWORD is not set and infra/local/.env.local was not found — " +
				"create it from .env.local.example (see infra/local/README-less compose header)",
		);
	}
	return `postgres://${user}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
}

/** libpq-only params that postgres-js would mis-forward as runtime parameters. */
const LIBPQ_ONLY: Record<string, true> = {
	sslmode: true,
	sslrootcert: true,
	sslcert: true,
	sslkey: true,
	sslcrl: true,
	sslnegotiation: true,
	channel_binding: true,
};

/**
 * postgres-js connection config. Keeps any genuine runtime params in the URL,
 * lifts libpq's SSL vocabulary into the driver's own `ssl` option.
 */
export function pgDriverConfig(): {
	url: string;
	ssl: "verify-full" | "require" | "prefer" | false;
} {
	const u = new URL(databaseUrl());
	const sslmode = u.searchParams.get("sslmode");
	for (const k of Object.keys(LIBPQ_ONLY)) u.searchParams.delete(k);

	// Local stack is plaintext over loopback; anything else must be encrypted.
	const loopback = u.hostname === "127.0.0.1" || u.hostname === "localhost";
	const ssl = loopback
		? false
		: sslmode === "require" || sslmode === "prefer"
			? sslmode
			: "verify-full";

	return { url: u.toString(), ssl };
}
