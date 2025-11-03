import type { Meta, StoryObj } from '@storybook/react'
import { MarkdownRenderer } from './markdown-renderer'
import { CodeBlock } from './code-block'

const meta = {
  title: 'Blog/MarkdownRenderer',
  component: MarkdownRenderer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MarkdownRenderer>

export default meta
type Story = StoryObj<typeof meta>

export const Headings: Story = {
  render: () => (
    <MarkdownRenderer>
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
      <h4>Heading 4</h4>
    </MarkdownRenderer>
  ),
}

export const Paragraphs: Story = {
  render: () => (
    <MarkdownRenderer>
      <p>
        This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.
        You can also have <code>inline code</code> within paragraphs.
      </p>
      <p>
        This is another paragraph with a <a href="#">link to somewhere</a>.
      </p>
    </MarkdownRenderer>
  ),
}

export const Lists: Story = {
  render: () => (
    <MarkdownRenderer>
      <h3>Unordered List</h3>
      <ul>
        <li>First item</li>
        <li>Second item with <strong>bold text</strong></li>
        <li>Third item</li>
      </ul>

      <h3>Ordered List</h3>
      <ol>
        <li>First step</li>
        <li>Second step</li>
        <li>Third step</li>
      </ol>

      <h3>Nested Lists</h3>
      <ul>
        <li>
          Parent item
          <ul>
            <li>Child item 1</li>
            <li>Child item 2</li>
          </ul>
        </li>
        <li>Another parent item</li>
      </ul>
    </MarkdownRenderer>
  ),
}

export const CodeBlocks: Story = {
  render: () => (
    <MarkdownRenderer>
      <h3>TypeScript Example</h3>
      <CodeBlock language="typescript">
        {`interface User {
  id: string
  name: string
  email: string
}

function greetUser(user: User): string {
  return \`Hello, \${user.name}!\`
}`}
      </CodeBlock>

      <h3>JavaScript Example</h3>
      <CodeBlock language="javascript">
        {`const fetchData = async () => {
  const response = await fetch('/api/data')
  const data = await response.json()
  return data
}`}
      </CodeBlock>
    </MarkdownRenderer>
  ),
}

export const Blockquote: Story = {
  render: () => (
    <MarkdownRenderer>
      <blockquote>
        <p>
          This is a blockquote. It can contain <strong>formatted text</strong> and{' '}
          <a href="#">links</a>.
        </p>
        <p>It can also have multiple paragraphs.</p>
      </blockquote>
    </MarkdownRenderer>
  ),
}

export const Separator: Story = {
  render: () => (
    <MarkdownRenderer>
      <p>Content before separator</p>
      <hr />
      <p>Content after separator</p>
    </MarkdownRenderer>
  ),
}

export const CompleteArticle: Story = {
  render: () => (
    <MarkdownRenderer>
      <h1>Complete Article Example</h1>

      <p>
        This is an introduction paragraph that sets up the topic. It contains some{' '}
        <strong>important information</strong> and provides context for what follows.
      </p>

      <h2>Getting Started</h2>

      <p>
        Before we dive in, make sure you have the following prerequisites installed:
      </p>

      <ul>
        <li>Node.js 18 or higher</li>
        <li>Bun package manager</li>
        <li>A code editor like VS Code</li>
      </ul>

      <h3>Installation</h3>

      <p>First, install the required dependencies:</p>

      <CodeBlock language="bash">
        {`bun install react react-dom
bun add -d typescript @types/react`}
      </CodeBlock>

      <h3>Configuration</h3>

      <p>Create a configuration file with the following content:</p>

      <CodeBlock language="typescript">
        {`export default {
  entry: './src/main.tsx',
  output: {
    path: './dist',
    filename: 'bundle.js',
  },
}`}
      </CodeBlock>

      <blockquote>
        <p>
          <strong>Note:</strong> Make sure to adjust the paths according to your project
          structure.
        </p>
      </blockquote>

      <h2>Advanced Features</h2>

      <p>Once you have the basic setup working, you can explore these advanced features:</p>

      <ol>
        <li>Server-side rendering for better performance</li>
        <li>Code splitting for optimized bundle sizes</li>
        <li>Progressive enhancement for accessibility</li>
      </ol>

      <hr />

      <h2>Conclusion</h2>

      <p>
        In this article, we covered the basics of setting up a modern development
        environment. For more information, check out the{' '}
        <a href="#">official documentation</a>.
      </p>
    </MarkdownRenderer>
  ),
}
