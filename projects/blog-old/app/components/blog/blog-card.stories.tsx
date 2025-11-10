import type { Meta, StoryObj } from '@storybook/react'
import { expect, within } from '@storybook/test'
import { BlogCard, BlogCardSkeleton } from './blog-card'
import { mockBlogPosts } from '@/lib/mock-data'

const meta = {
  title: 'Blog/BlogCard',
  component: BlogCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BlogCard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default blog card with all elements visible
 */
export const Default: Story = {
  args: {
    post: mockBlogPosts[0],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Verify title is rendered
    const title = canvas.getByText(args.post.title)
    await expect(title).toBeInTheDocument()

    // Verify author name is present
    const author = canvas.getByText(args.post.author.name)
    await expect(author).toBeInTheDocument()

    // Verify at least one tag is rendered
    const firstTag = canvas.getByText(args.post.tags[0].name)
    await expect(firstTag).toBeInTheDocument()

    // Verify link has correct href
    const link = canvas.getByRole('link')
    await expect(link).toHaveAttribute('href', `/blog/${args.post.slug}`)

    // Verify excerpt is shown (not compact variant)
    if (args.post.excerpt) {
      const excerpt = canvas.getByText(args.post.excerpt)
      await expect(excerpt).toBeInTheDocument()
    }
  },
}

export const Featured: Story = {
  args: {
    post: mockBlogPosts[0],
  },
}

export const WithoutImage: Story = {
  args: {
    post: {
      ...mockBlogPosts[2],
      image: undefined,
    },
  },
}

/**
 * Compact variant with reduced spacing and no excerpt
 */
export const Compact: Story = {
  args: {
    post: mockBlogPosts[1],
    variant: 'compact',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Verify title is present
    await expect(canvas.getByText(args.post.title)).toBeInTheDocument()

    // Verify excerpt is NOT shown in compact mode
    const excerptElement = canvasElement.querySelector('p.text-muted-foreground.line-clamp-2')
    await expect(excerptElement).not.toBeInTheDocument()

    // Verify tags are limited (should show max 2 tags in compact mode)
    const tagElements = canvasElement.querySelectorAll('[class*="badge"]')
    await expect(tagElements.length).toBeLessThanOrEqual(2)
  },
}

export const CompactWithoutImage: Story = {
  args: {
    post: {
      ...mockBlogPosts[2],
      image: undefined,
    },
    variant: 'compact',
  },
}

export const LongTitle: Story = {
  args: {
    post: {
      ...mockBlogPosts[4],
      title:
        'This is a Very Long Blog Post Title That Should Wrap to Multiple Lines to Test How the Component Handles Long Text Content',
    },
  },
}

/**
 * Loading state with skeleton placeholders
 */
export const Loading: Story = {
  render: () => <BlogCardSkeleton />,
  play: async ({ canvasElement }) => {
    // Verify skeleton elements are present
    const skeletons = canvasElement.querySelectorAll('[class*="animate-pulse"]')
    await expect(skeletons.length).toBeGreaterThan(0)
  },
}

export const LoadingCompact: Story = {
  render: () => <BlogCardSkeleton variant="compact" />,
}

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockBlogPosts.slice(0, 6).map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  ),
}
