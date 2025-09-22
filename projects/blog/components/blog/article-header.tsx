import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Heading } from "@/components/ui/heading"
import { Text } from "@/components/ui/text"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

const articleHeaderVariants = cva(
  "space-y-6",
  {
    variants: {
      variant: {
        default: "",
        mgs: "mgs-panel p-8 rounded-lg border border-mgs-teal/30",
        "mgs-tactical": "mgs-panel mgs-brackets p-8 rounded-lg border border-mgs-teal/50",
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ArticleHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof articleHeaderVariants> {
  title: string
  excerpt?: string
  publishedAt: string
  readingTime?: string
  tags?: string[]
  author: {
    name: string
    avatar?: string
    bio?: string
  }
}

const ArticleHeader = React.forwardRef<HTMLDivElement, ArticleHeaderProps>(
  ({
    className,
    variant,
    title,
    excerpt,
    publishedAt,
    readingTime,
    tags,
    author,
    ...props
  }, ref) => {
    const isMGS = variant?.includes("mgs")

    return (
      <header
        className={cn(articleHeaderVariants({ variant, className }))}
        ref={ref}
        {...props}
      >
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant={isMGS ? "mgs" : "secondary"}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <Heading
          size="h1"
          variant={isMGS ? "mgs-terminal" : "default"}
          className={cn(
            "leading-tight",
            isMGS && "text-mgs-teal"
          )}
        >
          {title}
        </Heading>

        {/* Excerpt */}
        {excerpt && (
          <Text
            size="lg"
            variant={isMGS ? "mgs-muted" : "muted"}
            className="leading-relaxed"
          >
            {excerpt}
          </Text>
        )}

        {/* Meta Information */}
        <div className={cn(
          "flex flex-col gap-4 pt-4 border-t",
          isMGS ? "border-mgs-teal/30" : "border-border"
        )}>
          {/* Author */}
          <div className="flex items-start gap-4">
            <Avatar size="lg" variant={isMGS ? "mgs" : "default"}>
              {author.avatar && <AvatarImage src={author.avatar} alt={author.name} />}
              <AvatarFallback variant={isMGS ? "mgs" : "default"}>
                {author.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Text
                variant={isMGS ? "mgs" : "default"}
                weight="semibold"
              >
                {author.name}
              </Text>
              {author.bio && (
                <Text
                  variant={isMGS ? "mgs-muted" : "muted"}
                  size="sm"
                >
                  {author.bio}
                </Text>
              )}
            </div>
          </div>

          {/* Publication Info */}
          <div className="flex items-center gap-4 text-sm">
            <Text variant={isMGS ? "mgs-muted" : "muted"} size="sm">
              Published {publishedAt}
            </Text>
            {readingTime && (
              <>
                <span className={isMGS ? "text-mgs-teal/50" : "text-muted-foreground"}>•</span>
                <Text variant={isMGS ? "mgs-muted" : "muted"} size="sm">
                  {readingTime} read
                </Text>
              </>
            )}
          </div>
        </div>
      </header>
    )
  }
)
ArticleHeader.displayName = "ArticleHeader"

export { ArticleHeader, articleHeaderVariants }