# Project Setup Guide

This document contains detailed instructions for initializing new frontend projects in the Alpina Intelligence monorepo.

## When to Use This Guide

Consult this documentation when:
- Creating a new Next.js project
- Setting up development environments
- Configuring build tools and dependencies
- Troubleshooting setup issues

## Technology Stack

### Frontend Stack
- **Framework**: Next.js 14+ with App Router (not Pages Router)
- **Package Manager**: pnpm (required - use pnpm commands, never npm/yarn)
- **Styling**: Tailwind CSS v3 (manual setup) + Shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **State**: Zustand for global state
- **i18n**: next-intl for internationalization

### Component Development
- Shadcn/ui for UI components (generates source code, not external dependency)
- Storybook for component development and documentation
- Server Components by default, Client Components only when needed

## Step-by-Step Project Setup

### Step 1: Create Next.js Project
```bash
cd projects/
pnpm create next-app@latest project-name --typescript --no-tailwind --app --no-src-dir --import-alias "@/*"
cd project-name
```

**Important flags explained:**
- `--typescript`: Enable TypeScript support
- `--no-tailwind`: We'll install Tailwind manually for better control
- `--app`: Use App Router (not Pages Router)
- `--no-src-dir`: Keep files at project root for cleaner structure
- `--import-alias "@/*"`: Enable @ import aliases

### Step 2: Install and Configure Tailwind CSS
```bash
# Install Tailwind CSS v3 (not v4 alpha)
pnpm add -D tailwindcss@^3.4.0 postcss autoprefixer

# Initialize configuration files
pnpm dlx tailwindcss@^3.4.0 init -p
```

### Step 3: Configure Tailwind Properly

#### Rename and Replace tailwind.config.js

Rename `tailwind.config.js` to `tailwind.config.ts` and replace its content with:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

#### Add Tailwind Directives to globals.css

Add these lines at the **top** of `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 4: Initialize Shadcn/ui
```bash
pnpm dlx shadcn@latest init
```

**Recommended settings during initialization:**
- TypeScript: Yes
- Style: Default
- Base color: Slate (or project-specific choice)
- CSS variables: Yes

### Step 5a: Install Core Dependencies
```bash
pnpm add react-hook-form zod @hookform/resolvers zustand next-intl
```

### Step 5b: Initialize Storybook
```bash
pnpm dlx storybook@latest init
# When prompted:
# - "New to Storybook?" → Select "No: Skip onboarding & don't ask again"
# - "What configuration should we install?" → Select "Recommended: Component dev, docs, test"

# After completion, ensure pnpm manages dependencies:
pnpm install
```

**Note**: Let Storybook complete its setup normally. Even though it uses npm internally during initialization, running `pnpm install` afterward ensures pnpm manages all dependencies properly.

#### Configure Storybook for Your Project

1. **Update `.storybook/main.ts`** to support hybrid story organization:
```typescript
"stories": [
  "../stories/**/*.mdx",
  "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  "../components/ui/**/*.stories.@(js|jsx|mjs|ts|tsx)"  // Add this line
],
```

2. **Update `.storybook/preview.ts`** to import your global CSS:
```typescript
import type { Preview } from '@storybook/nextjs-vite'
import '../app/globals.css'  // Add this line

const preview: Preview = {
  // ... rest of config
```

**Important**: Without importing globals.css, your components will render without Tailwind styles!

### Step 5c: Configure Code Formatting
```bash
# Install Prettier
pnpm add -D prettier
```

**Create `.prettierrc` configuration file:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

**Add format scripts to package.json:**
Add these scripts to your `package.json` "scripts" section:
```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

**Configure VS Code Auto-Formatting:**
Create `.vscode/settings.json` in your project root:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

**Note**: This provides automatic code formatting on save (similar to Ruff for Python) and ensures consistent code style across the project.

## Common Setup Commands

### Development Commands
```bash
pnpm dev                    # Start development server
pnpm build                  # Build for production
pnpm lint                   # Run ESLint
pnpm format                 # Format all files with Prettier
pnpm format:check           # Check formatting without changing files
```

### Dependency Management
```bash
pnpm add package-name       # Add production dependency
pnpm add -D package-name    # Add dev dependency
pnpm remove package-name    # Remove dependency
```

### Monorepo Commands
```bash
pnpm --filter project-name dev     # Run command in specific project
pnpm -r dev                        # Run dev in all projects
pnpm -r build                      # Build all projects
```

### Component Management
```bash
pnpm dlx shadcn@latest add button  # Add Shadcn/ui component
pnpm dlx shadcn@latest add dialog  # Add dialog component
pnpm dlx shadcn@latest add form    # Add form component
```

### Storybook Commands
```bash
pnpm storybook              # Start Storybook dev server (port 6006)
pnpm build-storybook        # Build static Storybook for deployment
```

## Troubleshooting

### "Unknown at rule" Warning in VS Code
Install the "Tailwind CSS IntelliSense" extension:
1. Open VS Code extensions (Ctrl/Cmd + Shift + X)
2. Search for "Tailwind CSS IntelliSense"
3. Install the official extension by Tailwind Labs

### Shadcn/ui Fails to Initialize
This usually happens when Tailwind isn't properly configured:
1. Ensure `tailwind.config.ts` has proper content paths
2. Verify Tailwind directives are in `app/globals.css`
3. Make sure you're using Tailwind v3, not v4

### Package Installation Errors
```bash
# Clear package cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript Errors After Setup
```bash
# Check TypeScript configuration
pnpm tsc --noEmit
```

### Storybook Components Not Showing Styles
If your components appear unstyled in Storybook:
1. Ensure `../app/globals.css` is imported in `.storybook/preview.ts`
2. Restart Storybook server after making changes

### Storybook Not Finding Your Stories
If your stories don't appear in the sidebar:
1. Check that `.storybook/main.ts` includes the correct story paths
2. Restart Storybook after config changes
3. Verify your story files follow the naming pattern: `*.stories.tsx`

## Project Structure After Setup

Your project should have this structure:
```
project-name/
├── .vscode/                 # VS Code workspace settings
│   └── settings.json        # Auto-formatting configuration
├── .storybook/              # Storybook configuration
│   ├── main.ts
│   └── preview.ts
├── app/
│   ├── globals.css          # With Tailwind directives
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/                  # Shadcn/ui components (after adding some)
├── lib/
│   └── utils.ts             # Shadcn/ui utilities
├── stories/                 # Example stories (optional - can colocate)
├── .prettierrc              # Prettier configuration
├── tailwind.config.ts       # TypeScript config with proper content paths
├── postcss.config.js
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Using Storybook

Once running (`pnpm storybook`), you'll see:

- **Left Sidebar**: Component hierarchy and navigation
- **"Docs"**: Auto-generated documentation for your component
- **Story Names**: Individual component variants (Default, Primary, etc.)
- **Controls Panel**: Interactive prop editing (bottom panel)
- **Actions Panel**: Event logging for component interactions

Components in `components/ui/` will appear under "UI" category if you've added stories.

## Next Steps

After completing the setup:
1. Consult [FRONTEND_STANDARDS.md](./FRONTEND_STANDARDS.md) for development patterns
2. Add your first Shadcn/ui components
3. Set up your project's specific requirements
4. Configure additional integrations as needed