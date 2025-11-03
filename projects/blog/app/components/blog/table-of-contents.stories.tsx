import type { Meta, StoryObj } from '@storybook/react'
import { TableOfContents } from './table-of-contents'
import type { TableOfContentsItem } from '@/types/blog'
import { MarkdownRenderer } from './markdown-renderer'

const meta = {
  title: 'Blog/TableOfContents',
  component: TableOfContents,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TableOfContents>

export default meta
type Story = StoryObj<typeof meta>

const shortArticleTOC: TableOfContentsItem[] = [
  { id: 'introduction', text: 'Introduction', level: 2 },
  { id: 'getting-started', text: 'Getting Started', level: 2 },
  { id: 'conclusion', text: 'Conclusion', level: 2 },
]

const mediumArticleTOC: TableOfContentsItem[] = [
  { id: 'introduction', text: 'Introduction', level: 2 },
  {
    id: 'getting-started',
    text: 'Getting Started',
    level: 2,
    children: [
      { id: 'installation', text: 'Installation', level: 3 },
      { id: 'configuration', text: 'Configuration', level: 3 },
    ],
  },
  {
    id: 'advanced-features',
    text: 'Advanced Features',
    level: 2,
    children: [
      { id: 'ssr', text: 'Server-Side Rendering', level: 3 },
      { id: 'code-splitting', text: 'Code Splitting', level: 3 },
    ],
  },
  { id: 'conclusion', text: 'Conclusion', level: 2 },
]

const longArticleTOC: TableOfContentsItem[] = [
  { id: 'introduction', text: 'Introduction', level: 2 },
  {
    id: 'getting-started',
    text: 'Getting Started',
    level: 2,
    children: [
      { id: 'prerequisites', text: 'Prerequisites', level: 3 },
      { id: 'installation', text: 'Installation', level: 3 },
      { id: 'configuration', text: 'Configuration', level: 3 },
    ],
  },
  {
    id: 'core-concepts',
    text: 'Core Concepts',
    level: 2,
    children: [
      { id: 'components', text: 'Components', level: 3 },
      { id: 'state-management', text: 'State Management', level: 3 },
      { id: 'routing', text: 'Routing', level: 3 },
    ],
  },
  {
    id: 'advanced-features',
    text: 'Advanced Features',
    level: 2,
    children: [
      { id: 'ssr', text: 'Server-Side Rendering', level: 3 },
      { id: 'code-splitting', text: 'Code Splitting', level: 3 },
      { id: 'optimization', text: 'Performance Optimization', level: 3 },
    ],
  },
  {
    id: 'deployment',
    text: 'Deployment',
    level: 2,
    children: [
      { id: 'build', text: 'Building for Production', level: 3 },
      { id: 'hosting', text: 'Hosting Options', level: 3 },
    ],
  },
  { id: 'conclusion', text: 'Conclusion', level: 2 },
]

export const ShortArticle: Story = {
  args: {
    items: shortArticleTOC,
  },
}

export const MediumArticle: Story = {
  args: {
    items: mediumArticleTOC,
  },
}

export const LongArticle: Story = {
  args: {
    items: longArticleTOC,
  },
}

export const Empty: Story = {
  args: {
    items: [],
  },
}

export const WithArticle: Story = {
  render: () => (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-8">
      <MarkdownRenderer>
        <h1>Article Title</h1>
        <p>Introduction paragraph with some content.</p>

        <h2 id="getting-started">Getting Started</h2>
        <p>Content about getting started...</p>

        <h3 id="installation">Installation</h3>
        <p>Installation instructions...</p>

        <h3 id="configuration">Configuration</h3>
        <p>Configuration details...</p>

        <h2 id="advanced-features">Advanced Features</h2>
        <p>Advanced content...</p>

        <h3 id="ssr">Server-Side Rendering</h3>
        <p>SSR information...</p>

        <h3 id="code-splitting">Code Splitting</h3>
        <p>Code splitting explanation...</p>

        <h2 id="conclusion">Conclusion</h2>
        <p>Concluding remarks...</p>
      </MarkdownRenderer>

      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <TableOfContents items={mediumArticleTOC} />
        </div>
      </aside>
    </div>
  ),
}
