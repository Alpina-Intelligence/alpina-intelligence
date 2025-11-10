import { type ComponentProps, type ReactNode } from 'react'
import { CodeBlock } from './code-block'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface MarkdownRendererProps {
  children: ReactNode
  className?: string
}

export function MarkdownRenderer({ children, className }: MarkdownRendererProps) {
  return (
    <article
      className={`
        prose prose-neutral dark:prose-invert max-w-none
        prose-headings:font-bold prose-headings:tracking-tight
        prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8
        prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
        prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6
        prose-h4:text-xl prose-h4:mb-2 prose-h4:mt-4
        prose-p:text-base prose-p:leading-7 prose-p:mb-4
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:font-semibold prose-strong:text-foreground
        prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0
        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
        prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
        prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
        prose-li:mb-2
        prose-img:rounded-lg prose-img:shadow-md
        prose-hr:border-border prose-hr:my-8
        ${className}
      `}
    >
      {children}
    </article>
  )
}

// Custom components for MDX
export const mdxComponents = {
  h1: ({ children, ...props }: ComponentProps<'h1'>) => (
    <h1 {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: ComponentProps<'h2'>) => (
    <h2 {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: ComponentProps<'h3'>) => (
    <h3 {...props}>{children}</h3>
  ),
  h4: ({ children, ...props }: ComponentProps<'h4'>) => (
    <h4 {...props}>{children}</h4>
  ),
  p: ({ children, ...props }: ComponentProps<'p'>) => (
    <p {...props}>{children}</p>
  ),
  a: ({ children, href, ...props }: ComponentProps<'a'>) => (
    <a href={href} {...props} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}>
      {children}
    </a>
  ),
  code: ({ children, className, ...props }: ComponentProps<'code'>) => {
    const isInline = !className
    if (isInline) {
      return <code className={className} {...props}>{children}</code>
    }
    return (
      <CodeBlock className={className} {...props}>
        {String(children)}
      </CodeBlock>
    )
  },
  pre: ({ children }: ComponentProps<'pre'>) => <>{children}</>,
  blockquote: ({ children, ...props }: ComponentProps<'blockquote'>) => (
    <blockquote {...props}>{children}</blockquote>
  ),
  ul: ({ children, ...props }: ComponentProps<'ul'>) => (
    <ul {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: ComponentProps<'ol'>) => (
    <ol {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: ComponentProps<'li'>) => (
    <li {...props}>{children}</li>
  ),
  hr: (props: ComponentProps<'hr'>) => <Separator {...props} className="my-8" />,
  table: ({ children, ...props }: ComponentProps<'table'>) => (
    <div className="my-6 w-full overflow-x-auto">
      <Table {...props}>{children}</Table>
    </div>
  ),
  thead: ({ children, ...props }: ComponentProps<'thead'>) => (
    <TableHeader {...props}>{children}</TableHeader>
  ),
  tbody: ({ children, ...props }: ComponentProps<'tbody'>) => (
    <TableBody {...props}>{children}</TableBody>
  ),
  tr: ({ children, ...props }: ComponentProps<'tr'>) => (
    <TableRow {...props}>{children}</TableRow>
  ),
  th: ({ children, ...props }: ComponentProps<'th'>) => (
    <TableHead {...props}>{children}</TableHead>
  ),
  td: ({ children, ...props }: ComponentProps<'td'>) => (
    <TableCell {...props}>{children}</TableCell>
  ),
  img: ({ src, alt, ...props }: ComponentProps<'img'>) => (
    <img src={src} alt={alt} loading="lazy" {...props} />
  ),
}
