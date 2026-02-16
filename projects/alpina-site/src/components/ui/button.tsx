import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] text-xs font-mono uppercase tracking-wider transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive cursor-pointer border",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-primary-bright/30 hover:bg-primary-bright active:bg-primary-dim",
        destructive:
          "bg-destructive text-white border-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "border-border bg-transparent text-foreground hover:border-primary/60 hover:text-primary hover:bg-primary-subtle",
        secondary:
          "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80",
        ghost:
          "bg-transparent border-transparent text-foreground-muted hover:text-foreground hover:bg-card hover:border-border",
        link: "text-primary underline-offset-4 hover:underline border-transparent",
        terminal:
          "bg-transparent border-primary/40 text-primary hover:bg-primary-subtle hover:border-primary/60 before:content-['>'] before:mr-1.5 before:text-primary/60",
        command:
          "bg-background-elevated border-border text-foreground-muted hover:text-primary hover:border-primary/50",
      },
      size: {
        default: "h-8 px-3 py-1.5 has-[>svg]:px-2.5",
        xs: "h-5 gap-0.5 px-1.5 text-[10px] has-[>svg]:px-1 [&_svg:not([class*='size-'])]:size-2.5",
        sm: "h-6 gap-1 px-2 has-[>svg]:px-1.5",
        lg: "h-9 px-4 has-[>svg]:px-3",
        xl: "h-10 px-5 text-sm has-[>svg]:px-4",
        icon: "size-8",
        "icon-xs": "size-5 [&_svg:not([class*='size-'])]:size-2.5",
        "icon-sm": "size-6",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
