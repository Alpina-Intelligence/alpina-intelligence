import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Text } from "@/components/ui/text"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

const postCardVariants = cva(
  "group cursor-pointer transition-all duration-200",
  {
    variants: {
      variant: {
        default: "hover:shadow-md",
        mgs: "hover:shadow-lg hover:shadow-mgs-teal/20 hover:border-mgs-teal/60",
        "mgs-featured": "mgs-data-stream hover:shadow-xl hover:shadow-mgs-teal/30",
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface PostCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof postCardVariants> {
  href: string
  title: string
  excerpt?: string
  publishedAt: string
  readingTime?: string
  tags?: string[]
  author?: {
    name: string
    avatar?: string
  }
  featured?: boolean
}

const PostCard = React.forwardRef<HTMLDivElement, PostCardProps>(
  ({
    className,
    variant,
    href,
    title,
    excerpt,
    publishedAt,
    readingTime,
    tags,
    author,
    featured,
    ...props
  }, ref) => {
    const isMGS = variant?.includes("mgs")
    const cardVariant = isMGS
      ? featured
        ? "mgs-tactical"
        : "mgs"
      : "default"

    return (
      <Link href={href}>
        <Card
          className={cn(postCardVariants({ variant, className }))}
          variant={cardVariant}
          ref={ref}
          {...props}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className={cn(
                "line-clamp-2 group-hover:text-primary transition-colors",
                isMGS && "text-mgs-teal group-hover:text-mgs-teal/80 font-mono uppercase tracking-wider"
              )}>
                {title}
              </CardTitle>
              {featured && (
                <Badge variant={isMGS ? "mgs-new" : "default"} className="shrink-0">
                  {isMGS ? "NEW" : "Featured"}
                </Badge>
              )}
            </div>
            {excerpt && (
              <CardDescription className={cn(
                "line-clamp-3",
                isMGS && "text-mgs-teal/70 font-mono"
              )}>
                {excerpt}
              </CardDescription>
            )}
          </CardHeader>

          {tags && tags.length > 0 && (
            <CardContent className="pb-3">
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant={isMGS ? "mgs" : "secondary"}
                    className="text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <Text variant={isMGS ? "mgs-muted" : "muted"} size="xs">
                    +{tags.length - 3} more
                  </Text>
                )}
              </div>
            </CardContent>
          )}

          <CardFooter className="flex items-center justify-between pt-0">
            <div className="flex items-center gap-3">
              {author && (
                <div className="flex items-center gap-2">
                  <Avatar size="sm" variant={isMGS ? "mgs" : "default"}>
                    {author.avatar && <AvatarImage src={author.avatar} alt={author.name} />}
                    <AvatarFallback variant={isMGS ? "mgs" : "default"}>
                      {author.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Text
                    variant={isMGS ? "mgs-muted" : "muted"}
                    size="sm"
                    className="font-medium"
                  >
                    {author.name}
                  </Text>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Text variant={isMGS ? "mgs-muted" : "muted"} size="xs">
                {publishedAt}
              </Text>
              {readingTime && (
                <>
                  <span className={isMGS ? "text-mgs-teal/50" : "text-muted-foreground"}>•</span>
                  <Text variant={isMGS ? "mgs-muted" : "muted"} size="xs">
                    {readingTime}
                  </Text>
                </>
              )}
            </div>
          </CardFooter>
        </Card>
      </Link>
    )
  }
)
PostCard.displayName = "PostCard"

export { PostCard, postCardVariants }