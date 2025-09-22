import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        mgs: "border-mgs-teal/50 bg-mgs-dark-800/80 text-mgs-teal font-mono text-xs uppercase tracking-wider hover:bg-mgs-dark-700/80",
        "mgs-alert": "border-mgs-orange/50 bg-mgs-orange/20 text-mgs-orange font-mono text-xs uppercase tracking-wider hover:bg-mgs-orange/30",
        "mgs-new": "border-mgs-teal bg-mgs-teal/20 text-mgs-teal font-mono text-xs uppercase tracking-wider animate-pulse-teal",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
