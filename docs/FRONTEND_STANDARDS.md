# Frontend Development Standards

This document outlines the development standards, conventions, and best practices for frontend development in the Alpina Intelligence monorepo.

## When to Use This Guide

Consult this documentation when:
- Building React components
- Implementing UI patterns
- Working with our design system
- Structuring component files
- Managing application state
- Writing forms and handling validation

## File Naming Conventions

### Components
- Use **PascalCase** for component files
- Include the component type in the name when appropriate
- Examples: `UserProfile.tsx`, `LoginForm.tsx`, `ProductCard.tsx`

### Utilities and Hooks
- Use **camelCase** for utility functions and custom hooks
- Custom hooks must start with `use`
- Examples: `useDebounce.ts`, `formatDate.ts`, `calculateTotal.ts`

### Stores (Zustand)
- Use **camelCase** with the pattern `use[Domain]Store.ts`
- Examples: `useAuthStore.ts`, `useCartStore.ts`, `useNotificationStore.ts`

### Types and Interfaces
- Use **PascalCase** for types and interfaces
- Consider adding suffix for clarity when needed
- Examples: `User`, `ApiResponse`, `FormData`, `ComponentProps`

## Import Organization

Organize imports in this specific order:

```typescript
// 1. React and Next.js imports
import React from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party library imports
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// 3. Local component imports
import { Button } from '@/components/ui/button';
import { UserCard } from '@/components/UserCard';

// 4. Local utility imports
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';

// 5. Type imports (grouped separately)
import type { User } from '@/types/user';
import type { ComponentProps } from 'react';
```

## Component Patterns

### Component Structure
- Use **functional components only** (no class components)
- Define and export TypeScript interfaces for all component props
- Prefer composition over prop drilling for complex components

```typescript
interface UserProfileProps {
  user: User;
  onEdit?: () => void;
  className?: string;
}

export function UserProfile({ user, onEdit, className }: UserProfileProps) {
  // Component implementation
}
```

### Server vs Client Components
- **Default to Server Components** for better performance
- Use Client Components only when you need:
  - State management (useState, useReducer)
  - Event handlers (onClick, onChange, etc.)
  - Browser-only APIs
  - Custom hooks that use client-side features

```typescript
// Server Component (default)
export function ProductList({ products }: ProductListProps) {
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// Client Component (when needed)
'use client';

import { useState } from 'react';

export function SearchForm() {
  const [query, setQuery] = useState('');
  // Client-side logic here
}
```

### Props and Type Safety
- Always define TypeScript interfaces for component props
- Export interfaces when they might be reused
- Use proper typing for event handlers

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}
```

## State Management Patterns

### Local State (useState)
- Use for component-specific state that doesn't need to be shared
- Prefer controlled components for form inputs

### Global State (Zustand)
- Organize stores by domain concern, not technical categories
- Each store should follow the single responsibility principle
- Use TypeScript interfaces for type safety

```typescript
interface AuthStore {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const user = await authApi.login(credentials);
      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    set({ user: null });
  },

  updateProfile: async (data) => {
    // Implementation
  },
}));
```

## Form Development Patterns

### React Hook Form + Zod
All forms must use React Hook Form with Zod schema validation:

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// 1. Define Zod schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// 2. Derive TypeScript type
type LoginFormData = z.infer<typeof loginSchema>;

// 3. Use in component
export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

## Styling Guidelines

### Tailwind CSS Usage
- Use Tailwind utility classes for styling
- Prefer semantic class combinations over arbitrary values
- Use CSS variables for theming (configured via Shadcn/ui)

```typescript
// Good: Semantic utility classes
<button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
  Click me
</button>

// Avoid: Arbitrary values unless absolutely necessary
<button className="bg-[#ff0000] text-[14px]">
  Click me
</button>
```

### Component Composition
- Prefer small, focused components
- Use Shadcn/ui components as building blocks
- Create pattern components for common UI compositions

```typescript
// Pattern component example
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ data, columns, onRowClick }: DataTableProps<T>) {
  // Reusable data table implementation
}
```

## Internationalization (i18n)

### next-intl Usage
- All user-facing text must use translation keys
- Use the `useTranslations` hook for text
- Use locale-aware formatters for dates, numbers, etc.

```typescript
import { useTranslations } from 'next-intl';

export function WelcomeMessage({ userName }: { userName: string }) {
  const t = useTranslations('common');

  return (
    <h1>{t('welcome', { name: userName })}</h1>
  );
}
```

### Translation File Structure
```json
{
  "common": {
    "welcome": "Welcome, {name}!",
    "save": "Save",
    "cancel": "Cancel"
  },
  "auth": {
    "login": "Log In",
    "logout": "Log Out",
    "forgotPassword": "Forgot Password?"
  }
}
```

## Storybook Development Workflow

### When to Use Storybook
- Developing components in isolation from application context
- Testing component variants and edge cases
- Creating visual documentation for the design system
- Reviewing UI changes without running the full application
- Sharing component states with designers and stakeholders

### Story File Organization

We use a **hybrid approach** that optimizes for different types of components:

#### UI Components (Design System): Colocated Stories
For components in `components/ui/` (Shadcn/ui and design system components):
```
components/
├── ui/
│   ├── button.tsx
│   ├── button.stories.tsx
│   ├── card.tsx
│   ├── card.stories.tsx
│   ├── input.tsx
│   └── input.stories.tsx
```

**Why colocated?** These are foundational components that need tight coupling between implementation and documentation.

#### Application Components: Centralized Stories
For app-specific components, pages, and complex compositions:
```
stories/
├── components/           # App-specific components
│   ├── LoginForm.stories.tsx
│   └── UserProfile.stories.tsx
├── pages/               # Full page examples
│   ├── Dashboard.stories.tsx
│   └── Settings.stories.tsx
├── patterns/            # Complex compositions
│   └── DataTable.stories.tsx
```

**Why centralized?** These components often need extensive mock data, complex setups, or demonstrate full user flows.

### Writing Stories

Follow this pattern for all component stories:

**IMPORTANT:** Always use the correct Storybook import for Next.js projects:

```typescript
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Button',
  },
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    children: 'Loading...',
    disabled: true,
  },
};
```

### Storybook Best Practices

- **Create stories for all reusable components** - Every component in `components/ui/` should have colocated stories
- **Document props using argTypes** - Provide controls for interactive testing
- **Test different states** - Include loading, error, empty, and edge case states
- **Use meaningful story names** - Names should describe the variant or use case
- **Include accessibility testing** - Use Storybook's a11y addon
- **Keep stories simple** - Focus on the component, not complex application logic
- **Use decorators for context** - Wrap stories with providers, themes, or layouts when needed

### When to Use Each Approach

**Colocated Stories (components/ui/):**
- Design system components (Button, Card, Input)
- Foundational UI building blocks
- Components that rarely need mock data
- Reusable across multiple projects

**Centralized Stories (stories/):**
- Application-specific components
- Components requiring extensive mock data
- Full page demonstrations
- Complex user interaction flows
- Components that depend on app context

### Story Naming Conventions

- **File names**: `ComponentName.stories.tsx`
- **Story exports**: Use descriptive names like `Primary`, `WithIcon`, `Loading`, `Error`
- **Meta title**: Use hierarchical structure like `Components/Button` or `Forms/LoginForm`

### Common Storybook Issues & Solutions

#### Import Errors
- **❌ Wrong**: `import type { Meta, StoryObj } from '@storybook/react';`
- **✅ Correct**: `import type { Meta, StoryObj } from '@storybook/nextjs-vite';`

Use `@storybook/nextjs-vite` for Next.js projects to ensure proper TypeScript support and framework integration.

#### TypeScript Errors
- Remove unused imports to avoid TypeScript warnings
- Ensure all imported components are actually used in your stories
- Use proper type imports with `import type` for type-only imports

#### Component Path Issues
- Use consistent import paths (`@/components/ui/button` vs `./button`)
- Verify component exports match import statements
- Check file paths match actual directory structure

## Component Organization

### Directory Structure

Following our hybrid story organization approach:

```
components/
├── ui/                   # Shadcn/ui generated components (colocated stories)
│   ├── button.tsx
│   ├── button.stories.tsx
│   ├── card.tsx
│   ├── card.stories.tsx
│   └── input.tsx
├── forms/               # Application-specific forms (no stories here)
│   ├── LoginForm.tsx
│   └── SettingsForm.tsx
├── patterns/            # Reusable component compositions (no stories here)
│   ├── DataTable.tsx
│   └── SearchBar.tsx
└── layouts/             # Layout components (no stories here)
    ├── Header.tsx
    └── Sidebar.tsx

stories/                 # Centralized stories for app components
├── components/
│   ├── LoginForm.stories.tsx
│   └── SettingsForm.stories.tsx
├── patterns/
│   ├── DataTable.stories.tsx
│   └── SearchBar.stories.tsx
└── layouts/
    ├── Header.stories.tsx
    └── Sidebar.stories.tsx
```

### Colocating Types
- Define types close to where they're used
- Export types that are shared across components
- Use separate type files only for complex domain types

## Development Best Practices

### Error Handling
- Always handle loading and error states in components
- Use proper error boundaries for catching React errors
- Provide meaningful error messages to users

### Performance
- Use React.memo() for expensive computations
- Prefer Server Components to reduce client-side JavaScript
- Implement proper image optimization with next/image

### Accessibility
- Always include proper ARIA labels
- Ensure keyboard navigation works correctly
- Use semantic HTML elements
- Test with screen readers

### Testing Approach
- Write unit tests for utility functions
- Use Storybook for component visual testing
- Implement integration tests for critical user flows
- Include accessibility testing in component development

## Code Quality Standards

### TypeScript Usage
- Use strict mode configuration
- Avoid `any` types except in documented exceptional cases
- Prefer type inference where possible
- Use proper generic constraints for reusable components

### Code Review Guidelines
- Components should have single responsibility
- Props interfaces should be well-documented
- Complex logic should be extracted to custom hooks
- All user-facing text should use translation keys