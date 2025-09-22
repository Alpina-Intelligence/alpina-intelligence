# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo for Alpina Intelligence projects with the following directory structure:

- `libs/` - Shared libraries and utilities
- `packages/` - Reusable packages that can be consumed by multiple projects
- `projects/` - Individual frontend/fullstack applications (Next.js apps)
- `services/` - Backend service applications and APIs

## Core Technology Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS v3, Shadcn/ui
- **Package Manager**: pnpm (required - never use npm/yarn)
- **Forms**: React Hook Form + Zod validation
- **State**: Zustand for global state
- **Components**: Server Components by default, Client Components when needed
- **Development**: Storybook for isolated component development and testing

## When to Consult Specialized Documentation

### Project Initialization
When creating new projects, setting up development environments, or configuring build tools:
→ See [docs/PROJECT_SETUP.md](./docs/PROJECT_SETUP.md) for detailed procedures and configuration templates

### Frontend Development Standards
When building React components, implementing UI patterns, or working with the design system:
→ See [docs/FRONTEND_STANDARDS.md](./docs/FRONTEND_STANDARDS.md) for component patterns, naming conventions, and style guidelines

### API Development
When creating new endpoints, implementing authentication, or structuring backend services:
→ See [docs/BACKEND_STANDARDS.md](./docs/BACKEND_STANDARDS.md) for FastAPI patterns and service architecture *(coming soon)*

## Essential Commands

```bash
# Development
pnpm dev                              # Start development server
pnpm --filter project-name dev        # Run dev in specific project
pnpm storybook                        # Start Storybook component dev server

# Dependencies
pnpm add package-name                 # Add dependency
pnpm dlx shadcn@latest add button     # Add Shadcn/ui component
```

## Directory Placement Guidelines

1. Shared utilities and libraries → `libs/` directory
2. Reusable packages → `packages/` directory
3. Standalone applications → `projects/` directory
4. Service applications → `services/` directory

## Guidelines for AI Assistants

- **Always use pnpm commands** - never npm or yarn
- **Check shared code first** - look in `libs/` and `packages/` before creating new utilities
- **Prefer Server Components** - use Client Components only when necessary
- **Use Shadcn/ui components** - don't build custom UI from scratch
- **Validate forms with Zod** - define schemas for all form data
- **Follow monorepo patterns** - each project should be self-contained
- **Use translation keys** - all user-facing text should use next-intl
- **Consult specialized docs** - refer to docs/ directory for detailed guidance on specific tasks