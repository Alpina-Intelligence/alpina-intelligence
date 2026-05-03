import type { MDXComponents } from "mdx/types";

export const mdxComponents: MDXComponents = {
  h1: (props) => (
    <h1
      className="font-display text-xl font-bold text-foreground tracking-tight mt-10 mb-4 first:mt-0 normal-case"
      {...props}
    />
  ),
  h2: (props) => (
    <div className="flex items-center gap-3 mt-8 mb-4">
      <span className="data-label">//</span>
      <h2
        className="font-display text-base font-semibold text-foreground tracking-tight normal-case"
        {...props}
      />
      <div className="flex-1 h-px bg-border" />
    </div>
  ),
  h3: (props) => (
    <h3
      className="font-display text-sm font-semibold text-foreground mt-6 mb-3 normal-case"
      {...props}
    />
  ),
  p: (props) => (
    <p
      className="text-foreground-muted text-sm leading-relaxed mb-4"
      {...props}
    />
  ),
  a: (props) => (
    <a
      className="text-primary hover:text-primary-bright underline underline-offset-4 decoration-primary/30 hover:decoration-primary/60 transition-colors"
      {...props}
    />
  ),
  ul: (props) => <ul className="list-none space-y-1.5 mb-4 ml-4" {...props} />,
  ol: (props) => (
    <ol
      className="list-decimal space-y-1.5 mb-4 ml-6 text-foreground-muted text-sm marker:text-primary"
      {...props}
    />
  ),
  li: (props) => (
    <li
      className="text-foreground-muted text-sm leading-relaxed before:content-['//'] before:text-primary/50 before:mr-2 before:font-mono before:text-xs"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="bg-background-sunken border border-border rounded-[2px] p-4 mb-4 overflow-x-auto font-mono text-xs leading-relaxed"
      {...props}
    />
  ),
  code: ({ className, ...props }) => {
    const isInline = !className?.includes("language-");
    if (isInline) {
      return (
        <code
          className="bg-background-sunken border border-border rounded-[2px] px-1.5 py-0.5 font-mono text-xs text-primary"
          {...props}
        />
      );
    }
    return <code className={className} {...props} />;
  },
  blockquote: (props) => (
    <blockquote
      className="border-l-2 border-primary/40 pl-4 my-4 italic text-foreground-muted text-sm"
      {...props}
    />
  ),
  hr: () => <hr className="border-border-subtle my-8" />,
  strong: (props) => (
    <strong className="text-foreground font-semibold" {...props} />
  ),
  em: (props) => <em className="text-foreground-muted italic" {...props} />,
  table: (props) => (
    <div className="overflow-x-auto mb-4 border border-border rounded-[2px]">
      <table className="w-full text-xs font-mono" {...props} />
    </div>
  ),
  thead: (props) => (
    <thead
      className="bg-background-sunken border-b border-border"
      {...props}
    />
  ),
  th: (props) => (
    <th
      className="px-3 py-2 text-left text-foreground-subtle uppercase tracking-wider text-[10px]"
      {...props}
    />
  ),
  tr: (props) => (
    <tr className="border-b border-border-subtle last:border-0" {...props} />
  ),
  td: (props) => (
    <td className="px-3 py-2 text-foreground-muted" {...props} />
  ),
  img: (props) => (
    <img
      className="rounded-[2px] border border-border my-4 max-w-full"
      {...props}
    />
  ),
};
