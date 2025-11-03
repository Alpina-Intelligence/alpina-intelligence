# Testing Guide

This document explains how to write and run tests in this project using Storybook.

## Overview

We use **Storybook** for component testing with the following approach:

- **Stories as Tests**: Every story verifies that the component renders without errors
- **Interaction Tests**: Test user interactions and component behavior using the `play` function
- **Visual Testing**: Review component appearance across different themes and states
- **Accessibility Testing**: Built-in with `@storybook/addon-a11y`

## Running Tests

### In Storybook UI

1. Start Storybook:
   ```bash
   bun run storybook
   ```

2. Navigate to any story in the sidebar

3. Look for the **"Interactions"** panel at the bottom of the screen

4. Tests run automatically when you select a story

5. View test results, assertions, and step-through interactions

### Visual Indicators

- ✅ **Green checkmark**: All tests passed
- ❌ **Red X**: Test failed (click to see error details)
- **Step-through**: Click on individual test steps to see what happened

## Writing Interaction Tests

### Basic Structure

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { expect, within, userEvent } from '@storybook/test'
import { MyComponent } from './my-component'

const meta = {
  title: 'Components/MyComponent',
  component: MyComponent,
} satisfies Meta<typeof MyComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    // Component props
  },
  play: async ({ canvasElement, args }) => {
    // Scope queries to your component
    const canvas = within(canvasElement)

    // Make assertions
    await expect(canvas.getByText('Hello')).toBeInTheDocument()
  },
}
```

### Key Testing APIs

#### 1. **`within(canvasElement)`**
Scopes queries to your component's DOM tree:

```tsx
const canvas = within(canvasElement)
const button = canvas.getByRole('button', { name: /submit/i })
```

#### 2. **`expect(...)`**
Make assertions about component state:

```tsx
await expect(element).toBeInTheDocument()
await expect(element).toHaveAttribute('href', '/blog')
await expect(element).toHaveClass('active')
await expect(element).not.toBeInTheDocument()
```

#### 3. **`userEvent`**
Simulate user interactions:

```tsx
import { userEvent } from '@storybook/test'

// Click
await userEvent.click(button)

// Type text
await userEvent.type(input, 'Hello world')

// Select option
await userEvent.selectOptions(select, 'option1')

// Hover
await userEvent.hover(element)
```

#### 4. **Query Methods**

Common queries (use with `canvas`):

```tsx
// By role (preferred for accessibility)
canvas.getByRole('button', { name: /submit/i })
canvas.getByRole('link', { name: /home/i })

// By text
canvas.getByText('Hello World')
canvas.getByText(/hello/i) // Regex

// By label (for form inputs)
canvas.getByLabelText('Email')

// By test ID (last resort)
canvas.getByTestId('custom-element')
```

### Testing Patterns

#### Pattern 1: Component Rendering

```tsx
export const Default: Story = {
  args: { title: 'Hello' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Verify key elements render
    const title = canvas.getByText(args.title)
    await expect(title).toBeInTheDocument()
  },
}
```

#### Pattern 2: User Interactions

```tsx
export const ClickButton: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const button = canvas.getByRole('button')
    await userEvent.click(button)

    // Verify result of click
    const message = canvas.getByText(/clicked/i)
    await expect(message).toBeInTheDocument()
  },
}
```

#### Pattern 3: Form Validation

```tsx
export const FormValidation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const input = canvas.getByLabelText('Email')
    const submit = canvas.getByRole('button', { name: /submit/i })

    // Submit without filling form
    await userEvent.click(submit)

    // Check for error message
    const error = canvas.getByText(/required/i)
    await expect(error).toBeInTheDocument()
  },
}
```

#### Pattern 4: Conditional Rendering

```tsx
export const WithOptionalContent: Story = {
  args: { showExtra: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    if (args.showExtra) {
      const extra = canvas.getByText('Extra Content')
      await expect(extra).toBeInTheDocument()
    } else {
      const extra = canvas.queryByText('Extra Content')
      await expect(extra).not.toBeInTheDocument()
    }
  },
}
```

## Example: Complete Test

Here's a comprehensive example from our codebase:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { expect, within, userEvent } from '@storybook/test'
import { BlogCard } from './blog-card'
import { mockBlogPosts } from '@/lib/mock-data'

const meta = {
  title: 'Blog/BlogCard',
  component: BlogCard,
} satisfies Meta<typeof BlogCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    post: mockBlogPosts[0],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // 1. Verify title renders
    const title = canvas.getByText(args.post.title)
    await expect(title).toBeInTheDocument()

    // 2. Verify author name
    const author = canvas.getByText(args.post.author.name)
    await expect(author).toBeInTheDocument()

    // 3. Check link href
    const link = canvas.getByRole('link')
    await expect(link).toHaveAttribute('href', `/blog/${args.post.slug}`)

    // 4. Verify tags
    const tag = canvas.getByText(args.post.tags[0].name)
    await expect(tag).toBeInTheDocument()
  },
}
```

## Best Practices

### ✅ Do

1. **Use semantic queries**: Prefer `getByRole` and `getByLabelText` over `getByTestId`
2. **Test user behavior**: Focus on what users see and do, not implementation details
3. **Use regex for flexible matching**: `/submit/i` instead of exact strings
4. **Scope queries**: Always use `within(canvasElement)` to avoid cross-test pollution
5. **Add descriptive comments**: Explain what each test verifies
6. **Test accessibility**: Use role-based queries to ensure components are accessible

### ❌ Don't

1. **Don't test implementation details**: Avoid checking internal state or private methods
2. **Don't rely on CSS classes**: Use semantic queries instead
3. **Don't make tests brittle**: Use flexible text matching with regex
4. **Don't skip async/await**: Always await user events and expectations
5. **Don't over-test**: One assertion per logical concern

## Debugging Tips

### Test Failures

1. **Check the Interactions panel**: See which step failed
2. **Inspect the DOM**: Use browser DevTools to verify element structure
3. **Check query selectors**: Ensure you're querying the right elements
4. **Review error messages**: Storybook provides detailed failure info

### Common Issues

**"Unable to find element"**
- Element might not be rendered
- Query selector might be wrong
- Element might be outside `canvasElement` scope

**"Element is not clickable"**
- Element might be disabled
- Element might be hidden
- Need to wait for async operations

**"Multiple elements found"**
- Query is not specific enough
- Use more precise selectors
- Check if you need `getAllBy` instead of `getBy`

## Advanced Topics

### Testing Async Behavior

```tsx
import { waitFor } from '@storybook/test'

export const AsyncData: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Wait for element to appear
    await waitFor(() => {
      expect(canvas.getByText('Loaded')).toBeInTheDocument()
    })
  },
}
```

### Testing Zustand Stores

```tsx
import { useMyStore } from '@/stores/my-store'

export const StoreInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const button = canvas.getByRole('button')
    await userEvent.click(button)

    // Verify store state changed
    const state = useMyStore.getState()
    await expect(state.count).toBe(1)
  },
}
```

## Resources

- [Storybook Testing Documentation](https://storybook.js.org/docs/writing-tests)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Jest-DOM Matchers](https://github.com/testing-library/jest-dom)

## Getting Help

If you encounter issues:

1. Check this guide for common patterns
2. Review existing test stories in `app/components/**/*.stories.tsx`
3. Consult the Storybook documentation
4. Check the Interactions panel for detailed error messages
