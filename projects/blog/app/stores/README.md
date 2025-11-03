# Zustand Stores

This directory contains Zustand stores for client-side state management.

## What is Zustand?

Zustand is a small, fast, and scalable state management solution. It's simpler than Redux and more powerful than Context API for shared state.

## Current Stores

### `theme-store.ts`
Manages application theme (light/dark/purple) with localStorage persistence.

**Usage**:
```tsx
import { useThemeStore } from '@/stores/theme-store'

function MyComponent() {
  const { theme, setTheme } = useThemeStore()

  return (
    <button onClick={() => setTheme('dark')}>
      Current theme: {theme}
    </button>
  )
}
```

## Creating a New Store

### Basic Store (without persistence)

```typescript
import { create } from 'zustand'

interface MyState {
  count: number
  increment: () => void
  decrement: () => void
}

export const useMyStore = create<MyState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}))
```

### Store with localStorage Persistence

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MyPersistedState {
  userPreferences: {
    notifications: boolean
    emailUpdates: boolean
  }
  setNotifications: (enabled: boolean) => void
  setEmailUpdates: (enabled: boolean) => void
}

export const usePreferencesStore = create<MyPersistedState>()(
  persist(
    (set) => ({
      userPreferences: {
        notifications: true,
        emailUpdates: false,
      },
      setNotifications: (enabled) =>
        set((state) => ({
          userPreferences: { ...state.userPreferences, notifications: enabled },
        })),
      setEmailUpdates: (enabled) =>
        set((state) => ({
          userPreferences: { ...state.userPreferences, emailUpdates: enabled },
        })),
    }),
    {
      name: 'user-preferences-storage', // localStorage key
    }
  )
)
```

## Best Practices

1. **Keep stores focused**: One store per domain (e.g., theme, user, cart)
2. **Use TypeScript**: Always define interfaces for your state
3. **Immutable updates**: Use spread operators to create new objects
4. **Avoid over-using**: Not everything needs to be in Zustand - use local state when appropriate
5. **Consider persistence**: Use `persist` middleware for state that should survive page refreshes

## When to Use Zustand vs. TanStack Query

- **Zustand**: UI state, user preferences, app settings
- **TanStack Query**: Server state, API data, caching
- **Local useState**: Component-specific state that doesn't need sharing
