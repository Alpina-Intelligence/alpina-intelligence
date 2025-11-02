# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

### Frontend Stack

- **TypeScript** - Type-safe JavaScript
- **Bun** - Fast JavaScript runtime and package manager
- **React** - UI component library
- **TanStack Start** - Full-stack React framework with built-in SSR
- **shadcn/ui** - Accessible and customizable UI component library

### shadcn/ui Component Management

This project uses shadcn/ui for UI components. We have both the shadcn MCP server and CLI available.

**Workflow for adding components:**

1. **Explore & Search** - Use the shadcn MCP server tools to:
   - Search for components: `mcp__shadcn__search_items_in_registries`
   - View component details: `mcp__shadcn__view_items_in_registries`
   - Find usage examples: `mcp__shadcn__get_item_examples_from_registries`
   - Get add commands: `mcp__shadcn__get_add_command_for_items`

2. **Add Components** - Use the CLI to install:

   ```bash
   bunx --bun shadcn@canary add <component-name>
   ```

   Examples:

   ```bash
   bunx --bun shadcn@canary add button
   bunx --bun shadcn@canary add card dialog
   ```

3. **Verify** - After adding components, optionally use:
   - `mcp__shadcn__get_audit_checklist` to verify setup

**Note:** The MCP server is excellent for exploration and understanding what's available, but always use the CLI (`bunx --bun shadcn@canary add`) to actually install components into the project.

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

#### APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- **File Operations**: Use `Bun.file()` and `Bun.write()` instead of `node:fs`
  - Read: `await Bun.file(path).text()` instead of `fs.readFile(path, 'utf-8')`
  - Write: `await Bun.write(path, content)` instead of `fs.writeFile(path, content)`
  - No imports needed - Bun is globally available
- `Bun.$`ls`` instead of execa for shell commands.

#### Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

#### Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";

// import .css files directly and it works
import './index.css';

import { createRoot } from "react-dom/client";

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.
