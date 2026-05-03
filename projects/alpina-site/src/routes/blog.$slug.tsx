import { MDXProvider } from "@mdx-js/react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { mdxComponents } from "@/components/blog/mdx-components";
import { getPostComponent, getPostMeta } from "@/content/blog";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
  loader: ({ params }) => {
    const frontmatter = getPostMeta(params.slug);
    if (!frontmatter) throw notFound();
    return { frontmatter };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-mono text-foreground-muted">Post not found.</p>
    </div>
  ),
});

function BlogPostPage() {
  const { frontmatter } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const Content = getPostComponent(slug);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 grid-command pointer-events-none opacity-40" />
      <div className="fixed inset-0 scanlines pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 lg:px-8 pt-16 pb-16">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 mb-6 font-mono text-[10px] uppercase tracking-wider text-foreground-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          All Transmissions
        </Link>

        <header className="mb-8 pb-6 border-b border-border-subtle">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-3 h-3 text-foreground-subtle" />
            <time className="font-mono text-[10px] text-foreground-subtle uppercase tracking-wide">
              {new Date(frontmatter.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight normal-case mb-3">
            {frontmatter.title}
          </h1>
          <p className="text-foreground-muted text-sm leading-relaxed mb-4">
            {frontmatter.description}
          </p>
          <div className="flex items-center gap-1.5">
            {frontmatter.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        </header>

        <article className="prose-retro">
          {Content && (
            <MDXProvider components={mdxComponents}>
              <Content />
            </MDXProvider>
          )}
        </article>
      </div>
    </div>
  );
}
