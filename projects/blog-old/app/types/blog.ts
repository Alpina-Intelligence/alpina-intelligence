export interface Author {
  id: string
  name: string
  avatar?: string
  bio?: string
  twitter?: string
  github?: string
  website?: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  color?: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content?: string
  image?: string
  author: Author
  publishedAt: Date
  updatedAt?: Date
  tags: Tag[]
  readTime: number
  featured?: boolean
}

export interface TableOfContentsItem {
  id: string
  text: string
  level: number
  children?: TableOfContentsItem[]
}
