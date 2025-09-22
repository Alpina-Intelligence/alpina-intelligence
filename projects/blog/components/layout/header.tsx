import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { NavLink } from "@/components/ui/nav-link"
import { Button } from "@/components/ui/button"

const headerVariants = cva(
  "sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60",
  {
    variants: {
      variant: {
        default: "border-border bg-background/95",
        mgs: "border-mgs-teal/30 bg-mgs-dark-900/95 mgs-scanlines",
        "mgs-tactical": "border-mgs-teal/50 bg-mgs-dark-900/98 mgs-panel",
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface HeaderProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof headerVariants> {
  logo?: React.ReactNode
  navigation?: Array<{
    href: string
    label: string
    active?: boolean
  }>
  actions?: React.ReactNode
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className, variant, logo, navigation, actions, ...props }, ref) => {
    return (
      <header
        className={cn(headerVariants({ variant, className }))}
        ref={ref}
        {...props}
      >
        <div className="container flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            {logo}
          </div>

          {/* Navigation */}
          {navigation && (
            <nav className="flex items-center space-x-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  variant={variant?.includes("mgs") ? "mgs-ghost" : "ghost"}
                  active={item.active}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          {/* Actions */}
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </header>
    )
  }
)
Header.displayName = "Header"

export { Header, headerVariants }