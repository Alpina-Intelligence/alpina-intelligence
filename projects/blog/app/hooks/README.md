# Custom Hooks

This directory contains custom React hooks for the blog application.

## Patterns

### TanStack Query Hooks

For data fetching, use TanStack Query hooks. These hooks provide caching, revalidation, and loading states out of the box.

**Example**: See `use-blog-posts.example.ts` for a template.

**When to use**:
- Fetching data from APIs
- Server state management
- Automatic caching and revalidation
- Optimistic updates

### Zustand Hooks

For client-side state management, use Zustand stores (see `app/stores/`).

**When to use**:
- UI state that needs to be shared across components
- User preferences
- App-wide settings
- Any state that should persist in localStorage

### Standard React Hooks

Use built-in React hooks (`useState`, `useEffect`, etc.) for:
- Local component state
- One-off side effects
- Component-specific logic

## Best Practices

1. **Keep hooks focused**: One hook should do one thing well
2. **Name hooks clearly**: Use `use` prefix and descriptive names
3. **Document dependencies**: Always specify hook dependencies correctly
4. **Return consistent types**: Use TypeScript to ensure return types are stable
5. **Handle errors gracefully**: Always provide error states for async operations
