/**
 * Example TanStack Query hook for fetching blog posts
 *
 * To use this template:
 * 1. Install TanStack Query: bun add @tanstack/react-query
 * 2. Set up QueryClient in your app root
 * 3. Rename this file to remove `.example.ts`
 * 4. Update the API endpoint and types
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { BlogPost } from '@/types/blog'

/**
 * Fetch all blog posts
 */
export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const response = await fetch('/api/posts')
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts')
      }
      return response.json() as Promise<BlogPost[]>
    },
    // Optional: Configure stale time, cache time, etc.
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch a single blog post by slug
 */
export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${slug}`)
      if (!response.ok) {
        throw new Error('Failed to fetch blog post')
      }
      return response.json() as Promise<BlogPost>
    },
    enabled: !!slug, // Only run query if slug is provided
  })
}

/**
 * Create a new blog post (mutation example)
 */
export function useCreateBlogPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newPost: Omit<BlogPost, 'id'>) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      })
      if (!response.ok) {
        throw new Error('Failed to create blog post')
      }
      return response.json() as Promise<BlogPost>
    },
    // Invalidate and refetch blog posts after creation
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
    },
  })
}

/**
 * Example usage in a component:
 *
 * function BlogList() {
 *   const { data, isLoading, error } = useBlogPosts()
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <div>
 *       {data?.map(post => (
 *         <BlogCard key={post.id} post={post} />
 *       ))}
 *     </div>
 *   )
 * }
 */
