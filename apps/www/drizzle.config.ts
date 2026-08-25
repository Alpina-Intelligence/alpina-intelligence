import { defineConfig } from "drizzle-kit";
import { pgDriverConfig } from "./src/db/env.ts";

// postgres-js (drizzle-kit's driver) cannot read libpq's sslmode/sslrootcert from
// the URL — see src/db/env.ts. pgDriverConfig() strips them into `ssl`.
const { url, ssl } = pgDriverConfig();

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dbCredentials: { url, ssl },
	// Refuse to run against anything that isn't the local stack unless the
	// operator explicitly points elsewhere — drizzle-kit push/migrate against
	// prod happens at deploy, not from a laptop by accident.
	strict: true,
	verbose: true,
});
