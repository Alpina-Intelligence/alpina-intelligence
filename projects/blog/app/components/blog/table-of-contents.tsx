import { useEffect, useState } from 'react'
import type { TableOfContentsItem } from '@/types/blog'
import { cn } from '@/lib/utils'

interface TableOfContentsProps {
  items: TableOfContentsItem[]
  className?: string
}

export function TableOfContents({ items, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '0px 0px -80% 0px' }
    )

    items.forEach((item) => {
      const element = document.getElementById(item.id)
      if (element) observer.observe(element)
      if (item.children) {
        item.children.forEach((child) => {
          const childElement = document.getElementById(child.id)
          if (childElement) observer.observe(childElement)
        })
      }
    })

    return () => observer.disconnect()
  }, [items])

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <nav className={cn('space-y-1', className)}>
      <p className="font-semibold text-sm mb-4">On This Page</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => handleClick(item.id)}
              className={cn(
                'block w-full text-left text-sm transition-colors hover:text-foreground',
                activeId === item.id
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {item.text}
            </button>
            {item.children && item.children.length > 0 && (
              <div className="ml-4 mt-2 space-y-2 border-l border-border pl-3">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => handleClick(child.id)}
                    className={cn(
                      'block w-full text-left text-sm transition-colors hover:text-foreground',
                      activeId === child.id
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {child.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  )
}
