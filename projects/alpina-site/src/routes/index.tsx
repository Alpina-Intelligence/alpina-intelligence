import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Brain, ChevronRight, Crosshair, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
	const features = [
		{
			icon: <Crosshair className="w-4 h-4" />,
			title: "Player Analysis",
			description:
				"Deep statistical breakdowns of individual and team performance. Track trends across seasons.",
		},
		{
			icon: <Brain className="w-4 h-4" />,
			title: "Predictive Models",
			description:
				"ML models trained on historical data to forecast outcomes and identify value opportunities.",
		},
		{
			icon: <TrendingUp className="w-4 h-4" />,
			title: "Strategic Insights",
			description:
				"Actionable intelligence derived from advanced metrics. Data-driven decisions with confidence.",
		},
	];

	return (
		<div className="min-h-screen bg-background relative overflow-hidden">
			{/* Layered background effects */}
			<div className="fixed inset-0 grid-command pointer-events-none opacity-40" />
			<div className="fixed inset-0 scanlines pointer-events-none" />
			<div className="fixed inset-0 vignette pointer-events-none" />

			{/* Hero Section - Compact */}
			<section className="relative pt-16 pb-8">
				<div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
					<div className="grid lg:grid-cols-12 gap-6 items-start">
						{/* Main content */}
						<div className="lg:col-span-7">
							{/* Status bar */}
							<div className="flex items-center gap-4 mb-4 font-mono text-[10px] uppercase tracking-ultra">
								<span className="flex items-center gap-2">
									<span className="status-dot status-dot-pulse text-status-active" />
									<span className="text-foreground-subtle">System Online</span>
								</span>
								<span className="text-border">|</span>
								<span className="text-foreground-subtle">
									Session: <span className="text-primary">ALP-2024-001</span>
								</span>
							</div>

							{/* Headline */}
							<h1 className="mb-3">
								<span
									className="block font-display font-bold text-foreground text-glow tracking-tight"
									style={{ fontSize: "var(--text-display)" }}
								>
									ALPINA
								</span>
								<span className="block font-mono text-xs uppercase tracking-ultra text-primary mt-1">
									[ Intelligence Platform v2.0 ]
								</span>
							</h1>

							{/* Description */}
							<p className="text-foreground-muted text-sm max-w-md mb-6 leading-relaxed">
								Advanced analytics and predictive modeling for hockey.
								ML-powered insights from comprehensive statistical analysis.
							</p>

							{/* CTA group */}
							<div className="flex flex-wrap items-center gap-3">
								<Button variant="terminal" size="sm" className="glow-amber">
									Initialize Session
									<ArrowRight className="w-3 h-3" />
								</Button>
								<Button variant="ghost" size="sm">
									View Documentation
								</Button>
							</div>
						</div>

						{/* Status panel - right side */}
						<div className="lg:col-span-5 hidden lg:block">
							<div className="panel-border p-4 bg-background-sunken/50 rounded-[2px]">
								<div className="data-label mb-3">System Status</div>
								<div className="space-y-0">
									<StatusRow label="Data Pipeline" value="Operational" status="active" />
									<StatusRow label="Model Training" value="87% Complete" status="pending" />
									<StatusRow label="Last Sync" value="12:45:32 UTC" status="neutral" />
									<StatusRow label="Active Sessions" value="24" status="neutral" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section - Dense grid */}
			<section className="relative py-8 lg:py-10 border-t border-border-subtle">
				<div className="max-w-7xl mx-auto px-4 lg:px-8">
					{/* Section header - terminal style */}
					<div className="flex items-center gap-3 mb-6">
						<span className="data-label">//</span>
						<h2 className="font-mono text-xs uppercase tracking-ultra text-foreground-muted">
							Core Modules
						</h2>
						<div className="flex-1 h-px bg-border" />
					</div>

					{/* Uniform grid */}
					<div className="grid md:grid-cols-3 gap-4">
						{features.map((feature) => (
							<Card
								key={feature.title}
								className="group corner-accent card-hover"
							>
								<CardHeader>
									<div className="flex items-center gap-3">
										<div className="w-7 h-7 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
											{feature.icon}
										</div>
										<CardTitle>{feature.title}</CardTitle>
									</div>
								</CardHeader>
								<CardContent>
									<CardDescription>{feature.description}</CardDescription>
								</CardContent>
								<CardFooter>
									<Button variant="ghost" size="xs" className="ml-auto">
										Access <ChevronRight className="w-3 h-3" />
									</Button>
								</CardFooter>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section - Terminal style */}
			<section className="relative py-8 lg:py-10 border-t border-border-subtle">
				<div className="max-w-7xl mx-auto px-4 lg:px-8">
					<div className="panel-border p-4 lg:p-6 bg-background-sunken/30 rounded-[2px]">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
							<div>
								<div className="data-label mb-2">Access Control</div>
								<h2 className="font-mono text-sm text-foreground mb-1">
									Request Platform Access
								</h2>
								<p className="text-foreground-muted text-xs">
									Currently in private beta. Join the waitlist for early access.
								</p>
							</div>
							<Button variant="default" className="glow-amber shrink-0">
								Join Waitlist
								<ArrowRight className="w-3 h-3" />
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border-subtle py-4">
				<div className="max-w-7xl mx-auto px-4 lg:px-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
						<div className="font-mono text-[10px] uppercase tracking-wider text-foreground-subtle">
							<span className="text-primary">[</span>
							Alpina Intelligence Platform
							<span className="text-primary">]</span>
							<span className="ml-3">v2.0.0-beta</span>
						</div>
						<div className="font-mono text-[10px] text-foreground-subtle">
							&copy; 2024 Alpina Systems
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}

function StatusRow({
	label,
	value,
	status
}: {
	label: string;
	value: string;
	status: 'active' | 'pending' | 'error' | 'neutral'
}) {
	const statusColors = {
		active: 'text-status-active',
		pending: 'text-status-pending',
		error: 'text-status-error',
		neutral: 'text-foreground-muted',
	};

	return (
		<div className="flex items-center justify-between py-1.5 border-b border-border-subtle last:border-0">
			<span className="text-foreground-subtle font-mono text-[10px] uppercase tracking-wide">{label}</span>
			<span className={cn("font-mono text-xs", statusColors[status])}>{value}</span>
		</div>
	);
}
