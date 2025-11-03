import { Clock } from 'lucide-react'
import type { BlogPost } from '@/types/blog'
import { formatDate, formatReadTime } from '@/lib/blog-utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface BlogCardProps {
  post: BlogPost
  variant?: 'default' | 'compact'
}

export function BlogCard({ post, variant = 'default' }: BlogCardProps) {
  const isCompact = variant === 'compact'

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      {post.image && !isCompact && (
        <div className="relative aspect-video w-full overflow-hidden">
          <img
            src={post.image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {post.featured && (
            <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
              Featured
            </Badge>
          )}
        </div>
      )}

      <CardHeader className={isCompact ? 'pb-3' : ''}>
        <div className="flex flex-wrap gap-2 mb-2">
          {post.tags.slice(0, isCompact ? 2 : 3).map((tag) => (
            <Badge key={tag.id} variant="secondary" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>

        <a
          href={`/blog/${post.slug}`}
          className="group-hover:text-primary transition-colors"
        >
          <h3 className={`font-bold tracking-tight ${isCompact ? 'text-lg' : 'text-xl'}`}>
            {post.title}
          </h3>
        </a>
      </CardHeader>

      {!isCompact && (
        <CardContent>
          <p className="text-muted-foreground line-clamp-2">{post.excerpt}</p>
        </CardContent>
      )}

      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.author.avatar} alt={post.author.name} />
            <AvatarFallback>
              {post.author.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{post.author.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(post.publishedAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatReadTime(post.readTime)}</span>
        </div>
      </CardFooter>
    </Card>
  )
}

export function BlogCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const isCompact = variant === 'compact'

  return (
    <Card className="overflow-hidden">
      {!isCompact && <Skeleton className="aspect-video w-full" />}

      <CardHeader className={isCompact ? 'pb-3' : ''}>
        <div className="flex gap-2 mb-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className={`${isCompact ? 'h-6' : 'h-7'} w-3/4`} />
      </CardHeader>

      {!isCompact && (
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      )}

      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-4 w-16" />
      </CardFooter>
    </Card>
  )
}
