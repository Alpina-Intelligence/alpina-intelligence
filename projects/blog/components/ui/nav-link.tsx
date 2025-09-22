import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const navLinkVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-foreground hover:text-foreground/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        underline: "text-foreground underline-offset-4 hover:underline",
        mgs: "text-mgs-teal hover:text-mgs-teal/80 font-mono uppercase tracking-wider text-xs",
        "mgs-active": "text-mgs-teal bg-mgs-teal/10 font-mono uppercase tracking-wider text-xs mgs-brackets",
        "mgs-ghost": "text-mgs-teal/70 hover:text-mgs-teal hover:bg-mgs-teal/10 font-mono uppercase tracking-wider text-xs transition-all duration-200",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface NavLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">,
    VariantProps<typeof navLinkVariants> {
  href: string
  active?: boolean
  external?: boolean
}

const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, variant, size, href, active, external, children, ...props }, ref) => {
    const linkVariant = active && variant?.includes("mgs") ? "mgs-active" : variant

    if (external) {
      return (
        <a
          className={cn(navLinkVariants({ variant: linkVariant, size, className }))}
          href={href}
          ref={ref}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      )
    }

    return (
      <Link
        className={cn(navLinkVariants({ variant: linkVariant, size, className }))}
        href={href}
        ref={ref}
        {...props}
      >
        {children}
      </Link>
    )
  }
)
NavLink.displayName = "NavLink"

export { NavLink, navLinkVariants }