declare module '*.mdx' {
  import type { MDXProps } from 'mdx/types'

  export const frontmatter: {
    title: string
    date: string
    author: string
    excerpt?: string
    tags?: string[]
    image?: string
    [key: string]: any
  }

  const MDXComponent: (props: MDXProps) => JSX.Element
  export default MDXComponent
}
