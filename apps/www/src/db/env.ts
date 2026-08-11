/**
 * Server-only DB connection settings. Tier-blind by contract (AGENTS.md
 * "Database naming contract"): only libpq's standard variables are read —
 * locally they default to the infra/local stack, deployed they arrive via
 * ConfigMap + Bitwarden-synced Secret and the defaults never fire.
 *
 * PGPASSWORD single source (local): infra/local/.env.local. We read it as a
 * FALLBACK when the var isn't already set, so `docker compose --env-file`,
 * drizzle-kit and the app all agree without a second copy in apps/www/.env.
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
