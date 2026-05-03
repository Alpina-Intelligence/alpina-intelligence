import { Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface BlogPostCardProps {
  title: string;
  date: string;
  description: string;
  tags: string[];
}

export function BlogPostCard({
  title,
  date,
  description,
  tags,
}: BlogPostCardProps) {
  return (
    <Card className="corner-accent card-hover">
      <CardHeader>
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-3 h-3 text-foreground-subtle" />
          <span className="font-mono text-[10px] text-foreground-subtle uppercase tracking-wide">
            {new Date(date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <CardTitle className="text-sm normal-case tracking-normal">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
