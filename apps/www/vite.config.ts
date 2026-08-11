import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		// Bun end to end (dev, CI, prod) - one runtime, no dev/prod skew. Code
		// stays runtime-portable (postgres-js, node:crypto) so reverting to the
		// node-server preset remains a one-line change if Bun ever misbehaves.
		nitro({ preset: "bun", rollupConfig: { external: [/^@sentry\//] } }),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
});

export default config;
