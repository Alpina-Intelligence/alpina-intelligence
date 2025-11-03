import { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'

interface CodeBlockProps {
  children: string
  className?: string
  language?: string
}

export function CodeBlock({ children, className, language }: CodeBlockProps) {
  const [html, setHtml] = useState<string>('')
  const lang = language || className?.replace('language-', '') || 'text'

  useEffect(() => {
    async function highlightCode() {
      try {
        const highlighted = await codeToHtml(children.trim(), {
          lang,
          theme: 'github-dark',
        })
        setHtml(highlighted)
      } catch (error) {
        console.error('Error highlighting code:', error)
        setHtml(`<pre><code>${children}</code></pre>`)
      }
    }

    highlightCode()
  }, [children, lang])

  if (!html) {
    return (
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
        <code className={className}>{children}</code>
      </pre>
    )
  }

  return (
    <div
      className="rounded-lg overflow-x-auto [&_pre]:p-4 [&_pre]:m-0 [&_pre]:bg-transparent"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
