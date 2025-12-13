---
name: initialize-tanstack-project
description: Initialize a new TanStack Start project in the alpina-intelligence monorepo. Use when creating a new web app, frontend project, or TanStack application. Creates projects in the projects/ directory with shadcn, drizzle, tailwind, and biome tooling.
---

# Initialize TanStack Project

This skill guides the creation of TanStack Start projects that are consistent with the alpina-intelligence monorepo configuration.

## Prerequisites

Before starting, verify:
1. Working directory is the monorepo root (`/home/eric/dev/alpina-intelligence`)
2. Bun is installed and available

## Step 1: Create Project with TanStack CLI

Run the following command, replacing `<project-name>` with the desired name:

```bash
bun create @tanstack/start@latest <project-name> \
  --target-dir projects \
  --tailwind \
  --add-ons shadcn,drizzle \
  --toolchain biome \
  --package-manager bun \
  --no-git \
  --add-on-config '{"drizzle":{"database":"postgresql"}}'
```

This creates a project with:
- TanStack Start (React + SSR)
- Tailwind CSS v4
- shadcn/ui components
- Drizzle ORM with PostgreSQL
- Biome for linting/formatting
- Bun as package manager

## Step 2: Add to Root tsconfig.json

Add the new project to the `references` array in the root `tsconfig.json`:

```json
{ "path": "projects/<project-name>" }
```

## Step 3: Configure Project tsconfig.json

Ensure the new project's `tsconfig.json` has `composite: true` in `compilerOptions`. This is required for TypeScript project references.

## Step 4: Remove Duplicate Dependencies

The monorepo root provides shared tooling. Remove these from the new project's `package.json` devDependencies if present:
- `typescript` (provided by root)
- `@biomejs/biome` (provided by root)

## Step 5: Remove Local Biome Config

If a `biome.json` file was created in the project directory, delete it. The root `biome.json` applies to all packages.

## Step 6: Remove Nested Git Repository

If a `.git/` directory exists in the project (created if `--no-git` was omitted), delete it. The monorepo uses a single git repository at the root.

## Step 7: Reinstall Dependencies

From the monorepo root, run:

```bash
bun install
```

This links the new project into the workspace.

## Verification

After completing all steps, run through the [checklist](./checklist.md) to verify the project is correctly configured.

## Monorepo Configuration Reference

The skill reads these files to ensure consistency:
- Root `tsconfig.json` - Project references
- Root `package.json` - Workspace configuration
- Root `biome.json` - Linting/formatting rules
