import { createFileRoute, Link } from "@tanstack/react-router";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { allPosts } from "@/content/blog";

export const Route = createFileRoute("/blog/")({
  component: BlogListingPage,
});

function BlogListingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 grid-command pointer-events-none opacity-40" />
      <div className="fixed inset-0 scanlines pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 lg:px-8 pt-16 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="data-label">{"//"}</span>
          <h1 className="font-mono text-xs uppercase tracking-ultra text-foreground-muted">
            Transmissions
          </h1>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-4">
          {allPosts.map((post) => (
            <Link
              key={post.slug}
              to="/blog/$slug"
              params={{ slug: post.slug }}
            >
              <BlogPostCard
                title={post.title}
                date={post.date}
                description={post.description}
                tags={post.tags}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
