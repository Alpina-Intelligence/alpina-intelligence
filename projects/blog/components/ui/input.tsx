import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "",
        mgs: "mgs-terminal bg-mgs-dark-900/50 border-mgs-teal/30 text-mgs-teal placeholder:text-mgs-teal/50 focus-visible:ring-mgs-teal focus-visible:border-mgs-teal/80",
        "mgs-alert": "mgs-terminal bg-mgs-dark-900/50 border-mgs-orange/30 text-mgs-orange placeholder:text-mgs-orange/50 focus-visible:ring-mgs-orange focus-visible:border-mgs-orange/80",
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
