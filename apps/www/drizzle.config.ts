import { defineConfig } from "drizzle-kit";
import { databaseUrl } from "./src/db/env.ts";

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dbCredentials: { url: databaseUrl() },
	// Refuse to run against anything that isn't the local stack unless the
	// operator explicitly points elsewhere — drizzle-kit push/migrate against
	// prod happens at deploy, not from a laptop by accident.
	strict: true,
	verbose: true,
});
