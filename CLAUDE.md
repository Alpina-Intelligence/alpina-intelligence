# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo for Alpina Intelligence projects with the following directory structure:

- `libs/` - Shared libraries
- `packages/` - Reusable packages
- `projects/` - Individual projects
- `services/` - Service applications

## Project Setup

This appears to be a newly initialized monorepo. When adding new projects or services:

1. Place shared utilities and libraries in the `libs/` directory
2. Place reusable packages in the `packages/` directory
3. Place standalone projects in the `projects/` directory
4. Place service applications in the `services/` directory

## Development Guidelines

Since this is a monorepo, consider the following when developing:

- When creating new components, check if similar functionality exists in the shared `libs/` or `packages/` directories first
- Follow consistent naming conventions across the monorepo
- Each project/service should be self-contained with its own dependencies and build configuration