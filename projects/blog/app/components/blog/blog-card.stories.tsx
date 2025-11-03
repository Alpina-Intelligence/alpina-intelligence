import type { Meta, StoryObj } from '@storybook/react'
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

export const Default: Story = {
  args: {
    post: mockBlogPosts[0],
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

export const Compact: Story = {
  args: {
    post: mockBlogPosts[1],
    variant: 'compact',
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

export const Loading: Story = {
  render: () => <BlogCardSkeleton />,
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
