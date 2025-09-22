import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Heading } from "@/components/ui/heading"
import { Text } from "@/components/ui/text"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

const authorBioVariants = cva(
  "",
  {
    variants: {
      variant: {
        default: "",
        mgs: "",
        "mgs-tactical": "",
      },
      layout: {
        horizontal: "flex items-start gap-4",
        vertical: "text-center space-y-4",
      }
    },
    defaultVariants: {
      variant: "default",
      layout: "horizontal",
    },
  }
)

export interface AuthorBioProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof authorBioVariants> {
  author: {
    name: string
    avatar?: string
    bio: string
    title?: string
    company?: string
    website?: string
    social?: {
      twitter?: string
      github?: string
      linkedin?: string
    }
  }
}

const AuthorBio = React.forwardRef<HTMLDivElement, AuthorBioProps>(
  ({
    className,
    variant,
    layout,
    author,
    ...props
  }, ref) => {
    const isMGS = variant?.includes("mgs")
    const cardVariant = isMGS
      ? variant === "mgs-tactical"
        ? "mgs-tactical"
        : "mgs"
      : "default"

    return (
      <Card
        variant={cardVariant}
        className={cn("", className)}
        ref={ref}
        {...props}
      >
        <CardContent className={cn(
          "p-6",
          authorBioVariants({ variant, layout })
        )}>
          {/* Avatar */}
          <Avatar
            size={layout === "vertical" ? "xl" : "lg"}
            variant={isMGS ? "mgs" : "default"}
            className={layout === "vertical" ? "mx-auto" : ""}
          >
            {author.avatar && <AvatarImage src={author.avatar} alt={author.name} />}
            <AvatarFallback variant={isMGS ? "mgs" : "default"}>
              {author.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className={cn(
            "space-y-3",
            layout === "horizontal" ? "flex-1" : ""
          )}>
            <div className="space-y-1">
              <Heading
                size="h4"
                variant={isMGS ? "mgs-terminal" : "default"}
              >
                {author.name}
              </Heading>
              {author.title && (
                <Text
                  variant={isMGS ? "mgs-muted" : "muted"}
                  size="sm"
                  weight="medium"
                >
                  {author.title}
                  {author.company && ` at ${author.company}`}
                </Text>
              )}
            </div>

            <Text
              variant={isMGS ? "mgs" : "default"}
              size="sm"
              className="leading-relaxed"
            >
              {author.bio}
            </Text>

            {/* Social Links */}
            {(author.website || author.social) && (
              <div className={cn(
                "flex gap-2",
                layout === "vertical" ? "justify-center" : "justify-start"
              )}>
                {author.website && (
                  <Button
                    variant={isMGS ? "mgs" : "outline"}
                    size={isMGS ? "mgs-compact" : "sm"}
                    asChild
                  >
                    <a href={author.website} target="_blank" rel="noopener noreferrer">
                      Website
                    </a>
                  </Button>
                )}
                {author.social?.twitter && (
                  <Button
                    variant={isMGS ? "mgs" : "outline"}
                    size={isMGS ? "mgs-compact" : "sm"}
                    asChild
                  >
                    <a href={author.social.twitter} target="_blank" rel="noopener noreferrer">
                      {isMGS ? "TWITTER" : "Twitter"}
                    </a>
                  </Button>
                )}
                {author.social?.github && (
                  <Button
                    variant={isMGS ? "mgs" : "outline"}
                    size={isMGS ? "mgs-compact" : "sm"}
                    asChild
                  >
                    <a href={author.social.github} target="_blank" rel="noopener noreferrer">
                      {isMGS ? "GITHUB" : "GitHub"}
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)
AuthorBio.displayName = "AuthorBio"

export { AuthorBio, authorBioVariants }