import type { Meta, StoryObj } from '@storybook/react'
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

export const Default: Story = {
  args: {
    post: mockBlogPosts[0],
  },
}

export const WithSubtitle: Story = {
  args: {
    post: mockBlogPosts[0],
    subtitle:
      'A comprehensive guide to building modern, performant blog applications using the latest web technologies.',
  },
}

export const WithUpdatedDate: Story = {
  args: {
    post: mockBlogPosts[1],
  },
}

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
