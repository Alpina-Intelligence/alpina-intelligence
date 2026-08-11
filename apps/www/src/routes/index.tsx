import {
	ArrowRightIcon,
	ChartLineUpIcon,
	CircuitryIcon,
	CompassIcon,
	DatabaseIcon,
	GaugeIcon,
	PaperPlaneTiltIcon,
	QuotesIcon,
	SparkleIcon,
} from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Contour } from "#/components/contour.tsx";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "#/components/ui/accordion.tsx";
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
import { Input } from "#/components/ui/input.tsx";
import { Separator } from "#/components/ui/separator.tsx";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "#/components/ui/tabs.tsx";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

/**
 * A tabs panel that always occupies its space: kept mounted, stacked via
 * grid, and hidden with `visibility` instead of the `hidden` attribute
 * (which Tailwind preflight sets to display:none !important).
 */
function StableTabPanel({
	value,
	children,
}: {
	value: string;
	children: React.ReactNode;
}) {
	return (
		<TabsContent
			value={value}
			keepMounted
			className="col-start-1 row-start-1 data-inactive:invisible"
			render={({ hidden: _hidden, ...props }, state) => (
				<div {...props} data-inactive={state.hidden ? "" : undefined} />
			)}
		>
			{children}
		</TabsContent>
	);
}

const services = [
	{
		icon: DatabaseIcon,
		title: "Data platforms",
		body: "Warehouse, lakehouse, pipelines, contracts. The unglamorous substrate every model stands on — built once, built boring.",
	},
	{
		icon: CircuitryIcon,
		title: "Machine learning systems",
		body: "From a promising notebook to a service with an SLO. Training, serving, retraining — owned by your team on day one.",
	},
	{
		icon: SparkleIcon,
		title: "LLM applications & agents",
		body: "Retrieval, evals, guardrails, cost ceilings. We ship the 20% of an AI feature that survives contact with production.",
	},
	{
		icon: ChartLineUpIcon,
		title: "Analytics & decision support",
		body: "A metrics layer people trust and dashboards people actually open. Fewer numbers, argued better.",
	},
	{
		icon: CompassIcon,
		title: "Data & AI strategy",
		body: "Build vs. buy, sequencing, hiring. A route plan with named summits — not a 40-page deck about 'unlocking value'.",
	},
	{
		icon: GaugeIcon,
		title: "Reliability & MLOps",
		body: "Monitoring, drift, lineage, spend. The pager should be quiet and the invoice should be explainable.",
	},
];

const steps = [
	{
		n: "01",
		title: "Survey",
		body: "Two weeks in your data estate: sources, quality, access, politics. You get a contour map of what's real, not what the wiki says.",
	},
	{
		n: "02",
		title: "Route",
		body: "We pick the smallest ascent that pays for itself and plan it end to end — scope, risks, and the point where we turn back.",
	},
	{
		n: "03",
		title: "Ascend",
		body: "We build with your engineers, in your repos, on your infrastructure. Pairing is the deliverable as much as the code.",
	},
	{
		n: "04",
		title: "Basecamp",
		body: "Handoff is a milestone, not an ending: runbooks, on-call training, and a system your team operates without us.",
	},
];

const faqs = [
	{
		q: "Do you work fixed-price or time & materials?",
		a: "Surveys are fixed-price with a written deliverable. Builds are milestone-based: each summit has a price, and you can stop at any camp.",
	},
	{
		q: "We already have a data team. Why bring you in?",
		a: "That's the ideal case. We're force multipliers, not replacements — we take the gnarly platform or ML problem your team hasn't had space for, and leave the capability behind.",
	},
	{
		q: "Which stack do you use?",
		a: "Yours, wherever sane. Where we choose: Postgres before anything exotic, open table formats, uv-managed Python, and the smallest amount of orchestration that works.",
	},
	{
		q: "Can you work with regulated or sensitive data?",
		a: "Yes — we default to your cloud, your keys, your audit trail. Nothing leaves your perimeter for our convenience.",
	},
];

function LandingPage() {
	return (
		<>
			{/* Hero */}
			<section className="relative overflow-hidden border-b">
				<Contour className="pointer-events-none absolute -right-24 top-8 hidden w-[640px] text-muted-foreground/25 lg:block" />
				<div className="mx-auto max-w-6xl px-4 py-24 lg:py-32">
					<Badge variant="secondary" className="mb-6">
						Data & AI consulting
					</Badge>
					<h1 className="max-w-2xl text-balance font-display font-semibold text-4xl tracking-tight lg:text-6xl">
						The route to production runs through your data.
					</h1>
					<p className="mt-6 max-w-xl text-lg text-muted-foreground">
						Alpina Intelligence designs, builds, and operates data platforms and
						AI systems that keep working after we leave. No expedition photos —
						just infrastructure your team can hold.
					</p>
					<div className="mt-8 flex flex-wrap items-center gap-3">
						<Button
							size="lg"
							// biome-ignore lint/a11y/useAnchorContent: Base UI render prop — children are injected by the primitive
							render={<a href="mailto:hello@alpina-intelligence.com" />}
							nativeButton={false}
						>
							Book an intro call
							<ArrowRightIcon />
						</Button>
						<Button
							size="lg"
							variant="outline"
							render={<Link to="/blog" />}
							nativeButton={false}
						>
							Read the field notes
						</Button>
					</div>
					<div className="mt-14 flex flex-wrap gap-x-10 gap-y-4 text-sm text-muted-foreground">
						<span>
							<span className="font-semibold text-foreground">14</span>{" "}
							platforms shipped
						</span>
						<span>
							<span className="font-semibold text-foreground">9</span>{" "}
							industries surveyed
						</span>
						<span>
							<span className="font-semibold text-foreground">0</span> systems
							we still babysit
						</span>
					</div>
				</div>
			</section>

			{/* Services */}
			<section id="services" className="mx-auto max-w-6xl px-4 py-20">
				<div className="mb-10 max-w-xl">
					<h2 className="font-display font-semibold text-3xl tracking-tight">
						What we do
					</h2>
					<p className="mt-3 text-muted-foreground">
						Six disciplines, one opinion: production is the only altitude that
						counts.
					</p>
				</div>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{services.map((s) => (
						<Card key={s.title}>
							<CardHeader>
								<s.icon size={24} className="mb-2" />
								<CardTitle>{s.title}</CardTitle>
								<CardDescription>{s.body}</CardDescription>
							</CardHeader>
						</Card>
					))}
				</div>
			</section>

			{/* Approach — a real sequence, so the numbering carries meaning */}
			<section id="approach" className="border-y bg-muted/40">
				<div className="mx-auto max-w-6xl px-4 py-20">
					<div className="mb-10 max-w-xl">
						<h2 className="font-display font-semibold text-3xl tracking-tight">
							The ascent, in four camps
						</h2>
						<p className="mt-3 text-muted-foreground">
							Every engagement walks the same route. The camps are where you can
							stop, resupply, or turn around.
						</p>
					</div>
					<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
						{steps.map((step) => (
							<div key={step.n}>
								<div className="font-mono text-muted-foreground text-sm">
									{step.n}
								</div>
								<h3 className="mt-2 font-medium text-lg">{step.title}</h3>
								<p className="mt-2 text-muted-foreground text-sm">
									{step.body}
								</p>
							</div>
						))}
					</div>

					<Separator className="my-14" />

					{/* Engagement models */}
					<div className="grid items-start gap-10 lg:grid-cols-2">
						<div>
							<h3 className="font-display font-semibold text-2xl tracking-tight">
								Three ways to rope up
							</h3>
							<p className="mt-3 text-muted-foreground">
								Sized by how much altitude you need to gain, not by headcount.
							</p>
						</div>
						<Tabs defaultValue="survey">
							<TabsList>
								<TabsTrigger value="survey">Survey</TabsTrigger>
								<TabsTrigger value="build">Build</TabsTrigger>
								<TabsTrigger value="embedded">Embedded</TabsTrigger>
							</TabsList>
							{/* All panels stay mounted, stacked in one grid cell, so the
							    section reserves the tallest panel's height and switching tabs
							    never shifts the layout below. Tailwind preflight nukes
							    [hidden] with !important, so StableTabPanel strips the attr
							    and styles a data attribute instead (visibility keeps the
							    space; invisible content is unfocusable and out of the a11y
							    tree). */}
							<div className="grid pt-4">
								<StableTabPanel value="survey">
									<Card>
										<CardHeader>
											<CardTitle>Survey — 2 weeks, fixed price</CardTitle>
											<CardDescription>
												A written map of your data estate: what's load-bearing,
												what's rotten, and the three moves worth making. Ends
												with a route plan you can execute without us.
											</CardDescription>
										</CardHeader>
									</Card>
								</StableTabPanel>
								<StableTabPanel value="build">
									<Card>
										<CardHeader>
											<CardTitle>Build — 6–12 weeks, per summit</CardTitle>
											<CardDescription>
												One scoped system taken to production: a platform, a
												model service, an AI feature. Milestone-priced; every
												camp is a safe place to stop.
											</CardDescription>
										</CardHeader>
									</Card>
								</StableTabPanel>
								<StableTabPanel value="embedded">
									<Card>
										<CardHeader>
											<CardTitle>Embedded — quarterly</CardTitle>
											<CardDescription>
												A senior pair inside your team, raising the floor:
												reviews, architecture, on-call maturity, hiring help.
												Renewed only while it compounds.
											</CardDescription>
										</CardHeader>
									</Card>
								</StableTabPanel>
							</div>
						</Tabs>
					</div>
				</div>
			</section>

			{/* Proof */}
			<section className="mx-auto max-w-6xl px-4 py-20">
				<Card>
					<CardContent className="grid gap-10 p-8 lg:grid-cols-[1fr_auto] lg:p-12">
						<div className="max-w-2xl">
							<QuotesIcon size={28} className="text-muted-foreground" />
							<blockquote className="mt-4 text-balance text-xl leading-relaxed">
								They rebuilt our forecasting stack in nine weeks, and the part I
								didn't expect: our own engineers run it now. The consultants
								made themselves unnecessary — on purpose.
							</blockquote>
							<div className="mt-6 flex items-center gap-3">
								<Avatar>
									<AvatarFallback>MK</AvatarFallback>
								</Avatar>
								<div className="text-sm">
									<div className="font-medium">Mira Kovač</div>
									<div className="text-muted-foreground">
										VP Engineering, mid-market logistics
									</div>
								</div>
							</div>
						</div>
						<div className="grid content-center gap-6 text-sm lg:border-l lg:pl-10">
							<div>
								<div className="font-display font-semibold text-3xl">-38%</div>
								<div className="text-muted-foreground">forecast error</div>
							</div>
							<div>
								<div className="font-display font-semibold text-3xl">9 wks</div>
								<div className="text-muted-foreground">to production</div>
							</div>
							<div>
								<div className="font-display font-semibold text-3xl">0</div>
								<div className="text-muted-foreground">
									our pagers, after handoff
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</section>

			{/* FAQ */}
			<section id="faq" className="mx-auto max-w-3xl px-4 pb-20">
				<h2 className="font-display font-semibold text-3xl tracking-tight">
					Sensible questions
				</h2>
				<Accordion className="mt-6">
					{faqs.map((f) => (
						<AccordionItem key={f.q} value={f.q}>
							<AccordionTrigger>{f.q}</AccordionTrigger>
							<AccordionContent>{f.a}</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</section>

			{/* CTA */}
			<section className="border-t bg-muted/40">
				<div className="mx-auto max-w-6xl px-4 py-16">
					<div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
						<div className="max-w-xl">
							<h2 className="font-display font-semibold text-3xl tracking-tight">
								Planning an ascent?
							</h2>
							<p className="mt-3 text-muted-foreground">
								Occasional field notes on data platforms and applied AI. No
								cadence promises, no funnel.
							</p>
						</div>
						<form
							className="flex w-full max-w-md items-center gap-2"
							onSubmit={(e) => e.preventDefault()}
						>
							<Input type="email" placeholder="you@company.com" required />
							<Button type="submit">
								Subscribe
								<PaperPlaneTiltIcon />
							</Button>
						</form>
					</div>
				</div>
			</section>
		</>
	);
}
