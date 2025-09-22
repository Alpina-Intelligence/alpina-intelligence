import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const headingVariants = cva(
  "font-semibold tracking-tight",
  {
    variants: {
      size: {
        h1: "text-4xl lg:text-5xl",
        h2: "text-3xl lg:text-4xl",
        h3: "text-2xl lg:text-3xl",
        h4: "text-xl lg:text-2xl",
        h5: "text-lg lg:text-xl",
        h6: "text-base lg:text-lg",
      },
      variant: {
        default: "",
        mgs: "font-tactical text-mgs-teal mgs-glitch uppercase tracking-widest",
        "mgs-terminal": "font-mono text-mgs-teal mgs-terminal uppercase tracking-wider",
        "mgs-alert": "font-mono text-mgs-orange uppercase tracking-wider animate-pulse",
      }
    },
    defaultVariants: {
      size: "h1",
      variant: "default",
    },
  }
)

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, size, variant, as, ...props }, ref) => {
    const Comp = as || (size === "h1" ? "h1" : size === "h2" ? "h2" : size === "h3" ? "h3" : size === "h4" ? "h4" : size === "h5" ? "h5" : "h6")

    return (
      <Comp
        className={cn(headingVariants({ size, variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

export { Heading, headingVariants }