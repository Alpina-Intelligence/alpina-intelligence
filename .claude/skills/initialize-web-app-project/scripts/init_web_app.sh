#!/bin/bash
set -e

# Check if project name is provided
if [ -z "$1" ]; then
  echo "Error: Project name is required"
  echo "Usage: ./init_web_app.sh <project-name>"
  exit 1
fi

PROJECT_NAME="$1"

# Create directory
echo "Creating directory: $PROJECT_NAME"
mkdir -p "$PROJECT_NAME"

# Change into directory and run bun init
echo "Initializing Bun project..."
cd "$PROJECT_NAME"

# Automatically select "blank" template by echoing the selection
# The 'blank' option is typically the first one, so we just press Enter
echo "" | bun init

echo ""
echo " Project initialized successfully!"
echo "To get started:"
echo "  cd $PROJECT_NAME"

# Install Vite and TanStack Router dependencies
echo "Installing Vite and TanStack Router..."
bun add @tanstack/react-start @tanstack/react-router
bun add -D vite
# We also need React
echo "Installing React and ReactDOM..."
bun add react react-dom
bun add -D @vitejs/plugin-react
# And add some TypeScript
bun add -D typescript @types/react @types/react-dom @types/node vite-tsconfig-paths

# Modify package.json to add scripts
echo "Adding scripts to package.json..."
bun -e '
const pkg = require("./package.json");
pkg.scripts = { dev: "vite dev", build: "vite build" };
require("fs").writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
'

# Update tsconfig.json to add path aliases
echo "Configuring TypeScript path aliases..."
bun -e '
const fs = require("fs");
const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"));
tsconfig.compilerOptions = tsconfig.compilerOptions || {};
tsconfig.compilerOptions.baseUrl = ".";
tsconfig.compilerOptions.paths = {
  "@/*": ["./app/*"]
};
fs.writeFileSync("tsconfig.json", JSON.stringify(tsconfig, null, 2) + "\n");
'

# Create vite.config.ts
echo "Creating vite.config.ts..."
cat > vite.config.ts << 'EOF'
// vite.config.ts
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart({
      srcDirectory: 'app',
      router: {
        routesDirectory: 'routes',
      },
    }),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
  ],
})
EOF

# Create app directory and router.tsx
echo "Creating app/router.tsx..."
mkdir -p app
cat > app/router.tsx << 'EOF'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
  })

  return router
}
EOF

# Create app/routes/__root.tsx
echo "Creating app/routes/__root.tsx..."
mkdir -p app/routes
cat > app/routes/__root.tsx << 'EOF'
/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import appCss from '@/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
EOF

# Add Tailwind
echo "Setting up Tailwind CSS..."
bun add tailwindcss @tailwindcss/postcss postcss

# Create postcss.config.ts
echo "Creating postcss.config.ts..."
cat > postcss.config.ts << 'EOF'
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
EOF

# Create app/styles/app.css
echo "Creating app/styles/app.css..."
mkdir -p app/styles
cat > app/styles/app.css << 'EOF'
@import "tailwindcss" source("../");
EOF

# Initialize shadcn
echo "Initializing shadcn/ui..."
echo "" | bunx --bun shadcn@canary init

echo ""
echo "✓ Project setup complete!"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  bun run dev"
