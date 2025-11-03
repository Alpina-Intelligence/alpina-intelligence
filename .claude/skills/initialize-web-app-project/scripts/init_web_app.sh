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
# Add comma to last property in compilerOptions if missing
sed -i 's/\("noPropertyAccessFromIndexSignature": false\)$/\1,/' tsconfig.json
# Insert baseUrl and paths before the closing brace of compilerOptions
sed -i '/^  }$/i\
\
    // Path aliases\
    "baseUrl": ".",\
    "paths": {\
      "@/*": ["./app/*"]\
    }' tsconfig.json

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

# Install Database dependencies
echo "Installing database dependencies (Drizzle ORM + Postgres)..."
bun add drizzle-orm postgres
bun add -D drizzle-kit

# Install UI component dependencies
echo "Installing UI components and utilities..."
bun add @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-label @radix-ui/react-progress @radix-ui/react-separator @radix-ui/react-switch @radix-ui/react-tooltip date-fns react-day-picker recharts zustand

# Install Storybook
echo "Installing Storybook..."
bun add -D @chromatic-com/storybook @storybook/addon-a11y @storybook/addon-docs @storybook/addon-onboarding @storybook/addon-themes @storybook/addon-vitest @storybook/react-vite @storybook/test storybook

# Create Storybook configuration
echo "Creating Storybook configuration..."
mkdir -p .storybook

cat > .storybook/main.ts << 'EOF'
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

const config: StorybookConfig = {
  "stories": [
    "../app/components/**/*.mdx",
    "../app/components/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y",
    "@storybook/addon-themes"
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [
        tsConfigPaths(),
      ],
    });
  },
};
export default config;
EOF

cat > .storybook/preview.ts << 'EOF'
import type { Preview } from '@storybook/react-vite'
import { withThemeByClassName } from '@storybook/addon-themes'
import '../app/styles/app.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true, // Disable backgrounds addon since we're using theme toggle
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
  ],
};

export default preview;
EOF

# Add Storybook scripts to package.json
echo "Adding Storybook scripts to package.json..."
bun -e '
const pkg = require("./package.json");
pkg.scripts.storybook = "storybook dev -p 6006";
pkg.scripts["build-storybook"] = "storybook build";
require("fs").writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
'

echo ""
echo "✓ Project setup complete!"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  bun run dev          # Start development server"
echo "  bun run storybook    # Start Storybook"
