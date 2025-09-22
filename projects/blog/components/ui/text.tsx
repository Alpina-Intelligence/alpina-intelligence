import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textVariants = cva(
  "",
  {
    variants: {
      size: {
        xs: "text-xs",
        sm: "text-sm",
        default: "text-base",
        lg: "text-lg",
        xl: "text-xl",
      },
      variant: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        mgs: "text-mgs-teal font-mono",
        "mgs-terminal": "text-mgs-teal font-mono mgs-terminal",
        "mgs-alert": "text-mgs-orange font-mono",
        "mgs-muted": "text-mgs-teal/70 font-mono",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default",
      weight: "normal",
    },
  }
)

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div" | "label"
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size, variant, weight, as = "p", ...props }, ref) => {
    const Comp = as

    return (
      <Comp
        className={cn(textVariants({ size, variant, weight, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"

export { Text, textVariants }