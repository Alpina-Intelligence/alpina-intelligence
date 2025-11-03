import { Clock, Calendar } from 'lucide-react'
import type { BlogPost } from '@/types/blog'
import { formatDate, formatReadTime } from '@/lib/blog-utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'

interface BlogHeaderProps {
  post: BlogPost
  subtitle?: string
}

export function BlogHeader({ post, subtitle }: BlogHeaderProps) {
  return (
    <header className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{post.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <Badge key={tag.id} variant="secondary">
            {tag.name}
          </Badge>
        ))}
      </div>

      {/* Title and Subtitle */}
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {post.title}
        </h1>
        {subtitle && (
          <p className="text-xl text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Author and Meta Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={post.author.avatar} alt={post.author.name} />
            <AvatarFallback>
              {post.author.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{post.author.name}</span>
            {post.author.bio && (
              <span className="text-sm text-muted-foreground line-clamp-1">
                {post.author.bio}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <time dateTime={post.publishedAt.toISOString()}>
              {formatDate(post.publishedAt, 'long')}
            </time>
          </div>
          {post.updatedAt && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span>Updated:</span>
              <time dateTime={post.updatedAt.toISOString()}>
                {formatDate(post.updatedAt)}
              </time>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{formatReadTime(post.readTime)}</span>
          </div>
        </div>
      </div>

      <Separator />
    </header>
  )
}
