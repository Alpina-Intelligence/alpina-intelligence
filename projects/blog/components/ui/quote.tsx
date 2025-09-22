import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const quoteVariants = cva(
  "border-l-4 pl-6 italic",
  {
    variants: {
      variant: {
        default: "border-border text-muted-foreground",
        mgs: "border-mgs-teal text-mgs-teal font-mono mgs-panel bg-mgs-dark-900/30 p-4 rounded-r-md",
        "mgs-alert": "border-mgs-orange text-mgs-orange font-mono bg-mgs-orange/10 p-4 rounded-r-md",
        "mgs-codec": "border-mgs-teal text-mgs-teal font-mono mgs-panel bg-mgs-dark-900/50 p-6 rounded-md mgs-brackets",
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface QuoteProps
  extends React.HTMLAttributes<HTMLQuoteElement>,
    VariantProps<typeof quoteVariants> {
  cite?: string
  author?: string
}

const Quote = React.forwardRef<HTMLQuoteElement, QuoteProps>(
  ({ className, variant, cite, author, children, ...props }, ref) => {
    return (
      <div className={cn("space-y-2", className)}>
        <blockquote
          className={cn(quoteVariants({ variant }))}
          cite={cite}
          ref={ref}
          {...props}
        >
          {children}
        </blockquote>
        {author && (
          <cite className={cn(
            "text-sm not-italic",
            variant?.includes("mgs") ? "text-mgs-teal/70 font-mono" : "text-muted-foreground"
          )}>
            — {author}
          </cite>
        )}
      </div>
    )
  }
)
Quote.displayName = "Quote"

export { Quote, quoteVariants }