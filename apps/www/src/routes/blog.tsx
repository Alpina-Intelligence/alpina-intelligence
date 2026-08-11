import { ArrowRightIcon, ClockIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "#/components/ui/avatar.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { Separator } from "#/components/ui/separator.tsx";

export const Route = createFileRoute("/blog")({
	component: BlogPage,
	head: () => ({
		meta: [{ title: "Field notes — Alpina Intelligence" }],
	}),
});

// Placeholder content until the blog gets a real content source.
const featured = {
	title: "The data platform you can hold in your head",
	summary:
		"Most platform architectures fail a simple test: can one engineer draw them from memory? A tour of the boring, load-bearing choices — Postgres first, open table formats, one orchestrator — that keep a platform legible for years.",
	date: "2026-07-28",
	readMinutes: 12,
	tags: ["Data platforms", "Architecture"],
	author: { name: "Eric Austin", initials: "EA" },
};

const posts = [
	{
		title: "Evals before agents",
		summary:
			"If you can't score it, you can't ship it. A practical eval harness for LLM features in under a day.",
		date: "2026-07-14",
		readMinutes: 8,
		tags: ["LLM", "Testing"],
	},
	{
		title: "Your warehouse doesn't need a catalog yet",
		summary:
			"Metadata tooling is camp-four equipment. Here's the altitude checklist that tells you when it's actually time.",
		date: "2026-06-30",
		readMinutes: 6,
		tags: ["Data platforms"],
	},
	{
		title: "Forecasting with boring models",
		summary:
			"Gradient boosting beat the transformer, again. What eleven demand-forecasting engagements taught us about baseline discipline.",
		date: "2026-06-11",
		readMinutes: 10,
		tags: ["ML", "Case study"],
	},
	{
		title: "The handoff is the product",
		summary:
			"Runbooks, on-call training, and the strange incentive of consultants who bill to become unnecessary.",
		date: "2026-05-27",
		readMinutes: 7,
		tags: ["Consulting"],
	},
	{
		title: "Row-level security is a feature, not a chore",
		summary:
			"Multi-tenant analytics without a service layer in the way: Postgres RLS patterns that survived production.",
		date: "2026-05-08",
		readMinutes: 9,
		tags: ["Postgres", "Security"],
	},
];

const dateFmt = new Intl.DateTimeFormat("en", {
	year: "numeric",
	month: "short",
	day: "numeric",
});

function PostMeta({ date, minutes }: { date: string; minutes: number }) {
	return (
		<div className="flex items-center gap-3 text-muted-foreground text-xs">
			<time dateTime={date}>{dateFmt.format(new Date(date))}</time>
			<span className="inline-flex items-center gap-1">
				<ClockIcon />
				{minutes} min
			</span>
		</div>
	);
}

function BlogPage() {
	return (
		<div className="mx-auto max-w-6xl px-4 py-16">
			<div className="max-w-xl">
				<h1 className="font-display font-semibold text-4xl tracking-tight">
					Field notes
				</h1>
				<p className="mt-3 text-muted-foreground">
					What we learned on the mountain: data platforms, applied AI, and the
					craft of leaving systems better-owned than we found them.
				</p>
			</div>

			{/* Featured */}
			<Card className="mt-10">
				<CardContent className="grid gap-6 p-8 lg:grid-cols-[2fr_1fr] lg:p-10">
					<div>
						<div className="flex flex-wrap gap-2">
							{featured.tags.map((t) => (
								<Badge key={t} variant="secondary">
									{t}
								</Badge>
							))}
						</div>
						<h2 className="mt-4 text-balance font-display font-semibold text-2xl tracking-tight lg:text-3xl">
							{featured.title}
						</h2>
						<p className="mt-3 max-w-2xl text-muted-foreground">
							{featured.summary}
						</p>
						<div className="mt-6 flex items-center gap-3">
							<Avatar className="size-8">
								<AvatarFallback>{featured.author.initials}</AvatarFallback>
							</Avatar>
							<span className="text-sm">{featured.author.name}</span>
							<Separator orientation="vertical" className="h-4" />
							<PostMeta date={featured.date} minutes={featured.readMinutes} />
						</div>
					</div>
					<div className="flex items-end justify-start lg:justify-end">
						<Button variant="outline">
							Read the note
							<ArrowRightIcon />
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Grid */}
			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{posts.map((post) => (
					<Card key={post.title} className="flex flex-col">
						<CardHeader>
							<div className="flex flex-wrap gap-2">
								{post.tags.map((t) => (
									<Badge key={t} variant="outline">
										{t}
									</Badge>
								))}
							</div>
							<CardTitle className="mt-2 text-lg">{post.title}</CardTitle>
							<CardDescription>{post.summary}</CardDescription>
						</CardHeader>
						<CardContent className="mt-auto">
							<PostMeta date={post.date} minutes={post.readMinutes} />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
