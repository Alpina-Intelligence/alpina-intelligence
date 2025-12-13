# Post-Creation Verification Checklist

After initializing a TanStack project, verify each item:

## Project Structure

- [ ] Project exists at `projects/<name>/`
- [ ] Project contains `package.json`, `tsconfig.json`, and `src/` directory

## Monorepo Integration

- [ ] Root `tsconfig.json` includes `{ "path": "projects/<name>" }` in references array
- [ ] Project `tsconfig.json` has `"composite": true` in compilerOptions

## Dependency Deduplication

- [ ] Project `package.json` has NO `typescript` in devDependencies
- [ ] Project `package.json` has NO `@biomejs/biome` in devDependencies
- [ ] No `biome.json` file exists in project directory
- [ ] No `.git/` directory exists in project (monorepo uses root git)

## Workspace Linking

- [ ] `bun install` ran successfully from monorepo root
- [ ] Project appears in workspace list (verify with `bun pm ls`)

## Quick Verification Commands

```bash
# Check tsconfig references
cat tsconfig.json | grep -A2 "references"

# Check for duplicate deps in new project
cat projects/<name>/package.json | grep -E "(typescript|biome)"

# Verify workspace linking
bun pm ls | grep <name>
```
