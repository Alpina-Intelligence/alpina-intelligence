import type { Author, BlogPost, Tag } from '@/types/blog'

export const mockAuthors: Author[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'https://i.pravatar.cc/150?img=1',
    bio: 'Full-stack developer passionate about web performance and developer experience.',
    twitter: 'sarahchen',
    github: 'sarahchen',
    website: 'https://sarahchen.dev',
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: 'Design engineer focused on accessible and beautiful user interfaces.',
    twitter: 'marcusrod',
    github: 'mrodriguez',
  },
  {
    id: '3',
    name: 'Aisha Patel',
    avatar: 'https://i.pravatar.cc/150?img=5',
    bio: 'Backend architect with a love for scalable systems and clean code.',
    github: 'aishap',
    website: 'https://aishapatel.io',
  },
]

export const mockTags: Tag[] = [
  { id: '1', name: 'React', slug: 'react', color: '#61DAFB' },
  { id: '2', name: 'TypeScript', slug: 'typescript', color: '#3178C6' },
  { id: '3', name: 'Web Performance', slug: 'web-performance', color: '#FF6B6B' },
  { id: '4', name: 'CSS', slug: 'css', color: '#264DE4' },
  { id: '5', name: 'Accessibility', slug: 'accessibility', color: '#4CAF50' },
  { id: '6', name: 'TanStack', slug: 'tanstack', color: '#FF4154' },
  { id: '7', name: 'MDX', slug: 'mdx', color: '#F9AC00' },
  { id: '8', name: 'Vite', slug: 'vite', color: '#646CFF' },
]

export const mockBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Building a Modern Blog with TanStack Start and MDX',
    slug: 'building-modern-blog-tanstack-start-mdx',
    excerpt:
      'Learn how to create a performant and developer-friendly blog using TanStack Start, MDX, and Shiki for beautiful syntax highlighting.',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
    author: mockAuthors[0],
    publishedAt: new Date('2025-10-28'),
    tags: [mockTags[0], mockTags[1], mockTags[5], mockTags[6]],
    readTime: 8,
    featured: true,
  },
  {
    id: '2',
    title: 'Optimizing React Performance: A Deep Dive',
    slug: 'optimizing-react-performance-deep-dive',
    excerpt:
      'Explore advanced techniques for optimizing React applications, from memoization strategies to code splitting and lazy loading.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    author: mockAuthors[0],
    publishedAt: new Date('2025-10-15'),
    updatedAt: new Date('2025-10-20'),
    tags: [mockTags[0], mockTags[2]],
    readTime: 12,
    featured: true,
  },
  {
    id: '3',
    title: 'Creating Accessible Components with shadcn/ui',
    slug: 'creating-accessible-components-shadcn-ui',
    excerpt:
      'A practical guide to building accessible React components using shadcn/ui and following WCAG guidelines.',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
    author: mockAuthors[1],
    publishedAt: new Date('2025-10-10'),
    tags: [mockTags[0], mockTags[4]],
    readTime: 10,
  },
  {
    id: '4',
    title: 'Modern CSS Techniques for 2025',
    slug: 'modern-css-techniques-2025',
    excerpt:
      'Discover the latest CSS features including container queries, cascade layers, and new color spaces that are changing web design.',
    image: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&q=80',
    author: mockAuthors[1],
    publishedAt: new Date('2025-09-28'),
    tags: [mockTags[3]],
    readTime: 7,
  },
  {
    id: '5',
    title: 'TypeScript Best Practices for Large Codebases',
    slug: 'typescript-best-practices-large-codebases',
    excerpt:
      'Learn how to structure TypeScript projects for maintainability, type safety, and developer productivity in large teams.',
    image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80',
    author: mockAuthors[2],
    publishedAt: new Date('2025-09-20'),
    tags: [mockTags[1]],
    readTime: 15,
  },
  {
    id: '6',
    title: 'Getting Started with Vite: The Next Generation Build Tool',
    slug: 'getting-started-with-vite',
    excerpt:
      'An introduction to Vite and why it has become the go-to build tool for modern JavaScript projects.',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
    author: mockAuthors[2],
    publishedAt: new Date('2025-09-05'),
    tags: [mockTags[7]],
    readTime: 6,
  },
]
