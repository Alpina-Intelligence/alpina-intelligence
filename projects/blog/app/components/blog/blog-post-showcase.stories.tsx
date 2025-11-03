import type { Meta, StoryObj } from '@storybook/react'
import { BlogHeader } from './blog-header'
import { BlogCard } from './blog-card'
import { MarkdownRenderer, mdxComponents } from './markdown-renderer'
import { TableOfContents } from './table-of-contents'
import { mockBlogPosts } from '@/lib/mock-data'
import { CodeBlock } from './code-block'

const meta = {
  title: 'Blog/Complete Blog Showcase',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const sampleTableOfContents = [
  { id: 'introduction', text: 'Introduction', level: 2 },
  {
    id: 'getting-started',
    text: 'Getting Started',
    level: 2,
    children: [
      { id: 'prerequisites', text: 'Prerequisites', level: 3 },
      { id: 'installation', text: 'Installation', level: 3 },
    ],
  },
  {
    id: 'core-concepts',
    text: 'Core Concepts',
    level: 2,
    children: [
      { id: 'components', text: 'Components', level: 3 },
      { id: 'routing', text: 'Routing', level: 3 },
    ],
  },
  { id: 'conclusion', text: 'Conclusion', level: 2 },
]

export const BlogListing: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Blog Posts</h1>
          <p className="text-lg text-muted-foreground">
            Explore articles about web development, React, TypeScript, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockBlogPosts.slice(0, 6).map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  ),
}

export const FullBlogPost: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <BlogHeader
            post={mockBlogPosts[0]}
            subtitle="A comprehensive guide to building modern, performant blog applications using the latest web technologies."
          />

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-12">
            <MarkdownRenderer>
              <h2 id="introduction">Introduction</h2>
              <p>
                Welcome to this comprehensive guide on building modern web applications. In
                this article, we'll explore the latest tools and techniques that will help
                you create fast, maintainable, and user-friendly applications.
              </p>

              <h2 id="getting-started">Getting Started</h2>
              <p>
                Before we dive into the implementation details, let's make sure you have
                everything you need to follow along.
              </p>

              <h3 id="prerequisites">Prerequisites</h3>
              <ul>
                <li>Node.js 18 or higher</li>
                <li>Basic knowledge of React and TypeScript</li>
                <li>A code editor (VS Code recommended)</li>
              </ul>

              <h3 id="installation">Installation</h3>
              <p>First, let's install the required dependencies:</p>

              <CodeBlock language="bash">
                {`bun create @tanstack/start my-app
cd my-app
bun install`}
              </CodeBlock>

              <blockquote>
                <p>
                  <strong>Tip:</strong> Make sure you're using the latest version of Bun for
                  the best experience.
                </p>
              </blockquote>

              <h2 id="core-concepts">Core Concepts</h2>
              <p>
                Now that we have everything set up, let's explore the core concepts that
                make this stack powerful.
              </p>

              <h3 id="components">Components</h3>
              <p>Components are the building blocks of your application:</p>

              <CodeBlock language="typescript">
                {`interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={\`btn btn-\${variant}\`}
    >
      {children}
    </button>
  )
}`}
              </CodeBlock>

              <h3 id="routing">Routing</h3>
              <p>
                TanStack Router provides type-safe routing with excellent developer
                experience:
              </p>

              <CodeBlock language="typescript">
                {`import { createRoute } from '@tanstack/react-router'

export const blogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/blog/$slug',
  component: BlogPost,
})`}
              </CodeBlock>

              <hr />

              <h2 id="conclusion">Conclusion</h2>
              <p>
                We've covered the essential concepts for building modern web applications.
                The combination of these technologies provides an excellent foundation for
                creating fast, type-safe, and maintainable applications.
              </p>

              <p>
                For more information, check out the official documentation and don't hesitate
                to experiment with these tools in your own projects. Happy coding!
              </p>
            </MarkdownRenderer>

            <aside className="hidden lg:block">
              <div className="sticky top-8">
                <TableOfContents items={sampleTableOfContents} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const BlogWithSidebar: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_250px] gap-8 container mx-auto px-4 py-12">
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <h3 className="font-semibold mb-4">Related Posts</h3>
            <div className="space-y-4">
              {mockBlogPosts.slice(0, 3).map((post) => (
                <BlogCard key={post.id} post={post} variant="compact" />
              ))}
            </div>
          </div>
        </aside>

        <main>
          <BlogHeader post={mockBlogPosts[1]} />
          <div className="mt-8">
            <MarkdownRenderer>
              <h2>Article Content</h2>
              <p>
                This is a demonstration of a blog layout with sidebars. The left sidebar
                shows related posts, while the right sidebar (on larger screens) shows a
                table of contents.
              </p>
              <p>
                This layout is perfect for long-form content where you want to provide
                additional navigation and related content without overwhelming the reader.
              </p>
            </MarkdownRenderer>
          </div>
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <TableOfContents items={sampleTableOfContents.slice(0, 3)} />
          </div>
        </aside>
      </div>
    </div>
  ),
}
