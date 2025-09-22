import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { NavLink } from "@/components/ui/nav-link"
import { Heading } from "@/components/ui/heading"
import { Text } from "@/components/ui/text"

const sidebarVariants = cva(
  "flex h-full w-64 flex-col border-r",
  {
    variants: {
      variant: {
        default: "border-border bg-background",
        mgs: "border-mgs-teal/30 bg-mgs-dark-900/95 mgs-grid",
        "mgs-tactical": "border-mgs-teal/50 bg-mgs-dark-900/98 mgs-panel mgs-brackets",
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SidebarSection {
  title?: string
  items: Array<{
    href: string
    label: string
    active?: boolean
    badge?: string
  }>
}

export interface SidebarProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sidebarVariants> {
  sections: SidebarSection[]
  header?: React.ReactNode
  footer?: React.ReactNode
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, variant, sections, header, footer, ...props }, ref) => {
    const isMGS = variant?.includes("mgs")

    return (
      <aside
        className={cn(sidebarVariants({ variant, className }))}
        ref={ref}
        {...props}
      >
        {/* Header */}
        {header && (
          <div className={cn(
            "border-b p-4",
            isMGS ? "border-mgs-teal/30" : "border-border"
          )}>
            {header}
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 space-y-6 p-4 overflow-y-auto">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-2">
              {section.title && (
                <Heading
                  size="h6"
                  variant={isMGS ? "mgs-terminal" : "default"}
                  className={cn(
                    "text-sm",
                    isMGS ? "text-mgs-teal/80" : "text-muted-foreground"
                  )}
                >
                  {section.title}
                </Heading>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      href={item.href}
                      variant={isMGS ? "mgs-ghost" : "ghost"}
                      size="sm"
                      active={item.active}
                      className="w-full justify-start"
                    >
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <Text
                          variant={isMGS ? "mgs-alert" : "muted"}
                          size="xs"
                          className={cn(
                            "rounded px-1.5 py-0.5",
                            isMGS
                              ? "bg-mgs-orange/20 text-mgs-orange"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {item.badge}
                        </Text>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {footer && (
          <div className={cn(
            "border-t p-4",
            isMGS ? "border-mgs-teal/30" : "border-border"
          )}>
            {footer}
          </div>
        )}
      </aside>
    )
  }
)
Sidebar.displayName = "Sidebar"

export { Sidebar, sidebarVariants }