import type { ComponentType } from "react";

export interface BlogPostMeta {
  title: string;
  date: string;
  description: string;
  tags: string[];
  slug: string;
}

interface BlogFrontmatter {
  title: string;
  date: string;
  description: string;
  tags: string[];
}

interface BlogModule {
  default: ComponentType;
  frontmatter: BlogFrontmatter;
}

function slugFromKey(key: string): string {
  // "./hello-world/index.mdx" -> "hello-world"
  return key.replace("./", "").replace("/index.mdx", "");
}

const modules = import.meta.glob<BlogModule>("./**/index.mdx", { eager: true });

export const allPosts: BlogPostMeta[] = Object.entries(modules)
  .map(([key, mod]) => ({
    ...mod.frontmatter,
    slug: slugFromKey(key),
  }))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export function getPostMeta(slug: string): BlogPostMeta | null {
  const key = `./${slug}/index.mdx`;
  const mod = modules[key];
  return mod ? { ...mod.frontmatter, slug } : null;
}

export function getPostComponent(slug: string): ComponentType | null {
  const key = `./${slug}/index.mdx`;
  const mod = modules[key];
  return mod ? mod.default : null;
}
