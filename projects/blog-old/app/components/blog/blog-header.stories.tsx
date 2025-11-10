import type { Meta, StoryObj } from '@storybook/react'
import { expect, within } from '@storybook/test'
import { BlogHeader } from './blog-header'
import { mockBlogPosts } from '@/lib/mock-data'

const meta = {
  title: 'Blog/BlogHeader',
  component: BlogHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BlogHeader>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default blog header with all standard elements
 */
export const Default: Story = {
  args: {
    post: mockBlogPosts[0],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Verify title is displayed
    const title = canvas.getByText(args.post.title)
    await expect(title).toBeInTheDocument()

    // Verify breadcrumb navigation
    const homeLink = canvas.getByRole('link', { name: /home/i })
    await expect(homeLink).toHaveAttribute('href', '/')

    const blogLink = canvas.getByRole('link', { name: /blog/i })
    await expect(blogLink).toHaveAttribute('href', '/blog')

    // Verify author info
    const authorName = canvas.getByText(args.post.author.name)
    await expect(authorName).toBeInTheDocument()

    // Verify tags are rendered
    const firstTag = canvas.getByText(args.post.tags[0].name)
    await expect(firstTag).toBeInTheDocument()

    // Verify read time is shown
    const readTimeRegex = new RegExp(`${args.post.readTime}\\s*min read`, 'i')
    const readTime = canvas.getByText(readTimeRegex)
    await expect(readTime).toBeInTheDocument()
  },
}

/**
 * Blog header with subtitle text
 */
export const WithSubtitle: Story = {
  args: {
    post: mockBlogPosts[0],
    subtitle:
      'A comprehensive guide to building modern, performant blog applications using the latest web technologies.',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Verify subtitle is displayed
    if (args.subtitle) {
      const subtitle = canvas.getByText(args.subtitle)
      await expect(subtitle).toBeInTheDocument()
      await expect(subtitle).toHaveClass('text-muted-foreground')
    }
  },
}

export const WithUpdatedDate: Story = {
  args: {
    post: mockBlogPosts[1],
  },
}

/**
 * Blog header with multiple tags
 */
export const ManyTags: Story = {
  args: {
    post: {
      ...mockBlogPosts[0],
      tags: [
        { id: '1', name: 'React', slug: 'react' },
        { id: '2', name: 'TypeScript', slug: 'typescript' },
        { id: '3', name: 'Web Performance', slug: 'web-performance' },
        { id: '4', name: 'CSS', slug: 'css' },
        { id: '5', name: 'Accessibility', slug: 'accessibility' },
      ],
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Verify all tags are rendered
    for (const tag of args.post.tags) {
      const tagElement = canvas.getByText(tag.name)
      await expect(tagElement).toBeInTheDocument()
    }

    // Count badge elements (should match tag count)
    const badges = canvasElement.querySelectorAll('[class*="badge"]')
    await expect(badges.length).toBe(args.post.tags.length)
  },
}

export const ShortAuthorBio: Story = {
  args: {
    post: {
      ...mockBlogPosts[0],
      author: {
        ...mockBlogPosts[0].author,
        bio: 'Developer',
      },
    },
  },
}

export const NoAuthorBio: Story = {
  args: {
    post: {
      ...mockBlogPosts[0],
      author: {
        ...mockBlogPosts[0].author,
        bio: undefined,
      },
    },
  },
}
