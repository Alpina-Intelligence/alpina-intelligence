import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { cn } from "#/lib/utils.ts";

export const Route = createFileRoute("/stack")({
	component: StackPage,
	head: () => ({
		meta: [{ title: "Stack — Alpina Intelligence" }],
	}),
});

/* ── Data ──────────────────────────────────────────────────────────────── */

type Status = "default" | "hot" | "eval" | "sunset";

interface Tool {
	area: string;
	name: string;
	since: number;
	jobs: number;
	note: string;
	status: Status;
}

const TOOLS: Tool[] = [
	{
		area: "data",
		name: "postgres",
		since: 2016,
		jobs: 14,
		note: "the default database — boring on purpose",
		status: "default",
	},
	{
		area: "data",
		name: "duckdb",
		since: 2022,
		jobs: 7,
		note: "analytics that fits in one process",
		status: "hot",
	},
	{
		area: "data",
		name: "dbt",
		since: 2020,
		jobs: 9,
		note: "SQL with discipline",
		status: "default",
	},
	{
		area: "data",
		name: "iceberg",
		since: 2023,
		jobs: 3,
		note: "open tables when the lake is real",
		status: "hot",
	},
	{
		area: "data",
		name: "kafka",
		since: 2019,
		jobs: 5,
		note: "when you genuinely have streams",
		status: "eval",
	},
	{
		area: "data",
		name: "dagster",
		since: 2022,
		jobs: 6,
		note: "orchestration with types",
		status: "default",
	},
	{
		area: "ml",
		name: "xgboost",
		since: 2017,
		jobs: 11,
		note: "still beats the transformer on tables",
		status: "default",
	},
	{
		area: "ml",
		name: "lightgbm",
		since: 2018,
		jobs: 8,
		note: "when xgboost is too slow",
		status: "hot",
	},
	{
		area: "ml",
		name: "pytorch",
		since: 2019,
		jobs: 6,
		note: "when deep learning earns its keep",
		status: "default",
	},
	{
		area: "ml",
		name: "scikit-learn",
		since: 2016,
		jobs: 13,
		note: "the baseline the fancy model must beat",
		status: "default",
	},
	{
		area: "ml",
		name: "mlflow",
		since: 2021,
		jobs: 5,
		note: "experiment tracking, nothing more",
		status: "eval",
	},
	{
		area: "ml",
		name: "optuna",
		since: 2021,
		jobs: 4,
		note: "hyperparameters without the folklore",
		status: "hot",
	},
	{
		area: "llm",
		name: "claude",
		since: 2023,
		jobs: 8,
		note: "the reasoning workhorse",
		status: "default",
	},
	{
		area: "llm",
		name: "pgvector",
		since: 2023,
		jobs: 6,
		note: "retrieval inside the database you have",
		status: "default",
	},
	{
		area: "llm",
		name: "vllm",
		since: 2024,
		jobs: 3,
		note: "self-hosted inference that saturates",
		status: "hot",
	},
	{
		area: "llm",
		name: "ollama",
		since: 2024,
		jobs: 4,
		note: "local models for local problems",
		status: "eval",
	},
	{
		area: "analytics",
		name: "metabase",
		since: 2019,
		jobs: 7,
		note: "dashboards people actually open",
		status: "default",
	},
	{
		area: "analytics",
		name: "evidence",
		since: 2023,
		jobs: 3,
		note: "reports as code",
		status: "hot",
	},
	{
		area: "analytics",
		name: "plotly",
		since: 2018,
		jobs: 6,
		note: "when the chart is the product",
		status: "eval",
	},
	{
		area: "infra",
		name: "k3s",
		since: 2024,
		jobs: 2,
		note: "kubernetes without the ceremony",
		status: "hot",
	},
	{
		area: "infra",
		name: "terraform",
		since: 2020,
		jobs: 8,
		note: "the edge, codified",
		status: "default",
	},
	{
		area: "infra",
		name: "uv",
		since: 2024,
		jobs: 5,
		note: "python packaging, solved",
		status: "default",
	},
	{
		area: "infra",
		name: "bun",
		since: 2024,
		jobs: 3,
		note: "the TS toolchain in one binary",
		status: "hot",
	},
	{
		area: "infra",
		name: "cloudflare",
		since: 2021,
		jobs: 9,
		note: "the only door to every origin",
		status: "default",
	},
];

/** Evaluated honestly, retired honestly. */
const GRAVEYARD = [
	"hadoop",
	"spark",
	"airflow",
	"mongodb",
	"elasticsearch",
	"kubeflow",
	"sagemaker",
	"snowflake",
	"looker",
	"langchain",
	"pinecone",
	"helm",
];

const STATUS_META: Record<Status, { dot: string; label: string; cls: string }> =
	{
		default: { dot: "●", label: "load-bearing", cls: "text-primary" },
		hot: { dot: "●", label: "hot path", cls: "text-foreground" },
		eval: { dot: "◐", label: "evaluating", cls: "text-muted-foreground" },
		sunset: { dot: "○", label: "sunset", cls: "text-muted-foreground" },
	};

/* ── Frame chrome: a bordered pane with its title set into the border ──── */

function Pane({
	title,
	className,
	children,
}: {
	title?: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={cn("relative border border-border", className)}>
			{title ? (
				<span className="-top-2.5 absolute left-2 bg-background px-1 font-mono text-primary text-xs">
					{title}
				</span>
			) : null}
			{children}
		</div>
	);
}

/* ── Page ──────────────────────────────────────────────────────────────── */

function StackPage() {
	const [query, setQuery] = React.useState("");
	const [area, setArea] = React.useState<string | null>(null);
	const [cursor, setCursor] = React.useState(0);
	const inputRef = React.useRef<HTMLInputElement>(null);

	const areas = React.useMemo(() => {
		const counts = new Map<string, number>();
		for (const t of TOOLS) counts.set(t.area, (counts.get(t.area) ?? 0) + 1);
		return [...counts.entries()];
	}, []);

	const filtered = React.useMemo(() => {
		const q = query.trim().toLowerCase();
		return TOOLS.filter(
			(t) =>
				(!area || t.area === area) &&
				(!q || `${t.area}/${t.name} ${t.note}`.toLowerCase().includes(q)),
		);
	}, [query, area]);

	const selected = filtered[Math.min(cursor, filtered.length - 1)];

	// biome-ignore lint/correctness/useExhaustiveDependencies: cursor resets when the visible list changes
	React.useEffect(() => setCursor(0), [query, area]);

	React.useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.metaKey || e.ctrlKey || e.altKey) return;
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setCursor((c) => Math.max(0, Math.min(c + 1, filtered.length - 1)));
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setCursor((c) => Math.max(c - 1, 0));
			} else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
				e.preventDefault();
				const names = [null, ...areas.map(([a]) => a)];
				const i = names.indexOf(area);
				const next =
					e.key === "ArrowRight"
						? names[(i + 1) % names.length]
						: names[(i - 1 + names.length) % names.length];
				setArea(next ?? null);
			} else if (e.key === "Escape") {
				setQuery("");
				setArea(null);
			} else if (e.key.length === 1) {
				inputRef.current?.focus();
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [filtered.length, areas, area]);

	return (
		<div className="mx-auto max-w-6xl px-4 py-10 font-mono text-sm">
			<Pane title="Stack" className="bg-background/60">
				<div className="grid md:grid-cols-[230px_1fr]">
					{/* ── Sidebar ── */}
					<aside className="border-border border-b p-3 md:border-r md:border-b-0">
						<div className="space-y-1">
							<button
								type="button"
								onClick={() => setArea(null)}
								className={cn(
									"flex w-full items-center justify-between px-1 text-left",
									area === null
										? "bg-accent text-accent-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								<span>&gt; all tools</span>
								<span>{TOOLS.length}</span>
							</button>
							{areas.map(([name, count]) => (
								<button
									key={name}
									type="button"
									onClick={() => setArea(name === area ? null : name)}
									className={cn(
										"flex w-full items-center justify-between px-1 text-left",
										area === name
											? "bg-accent text-accent-foreground"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									<span>
										<span className={STATUS_META.default.cls}>● </span>
										{name}
									</span>
									<span>{count}</span>
								</button>
							))}
						</div>
						<div className="mt-4 border-border border-t pt-3">
							<div className="px-1 text-muted-foreground/60 text-xs">
								the graveyard
							</div>
							<ul className="mt-1 space-y-0.5">
								{GRAVEYARD.map((name) => (
									<li key={name} className="px-1 text-muted-foreground/50">
										○ {name}
									</li>
								))}
							</ul>
						</div>
					</aside>

					{/* ── List ── */}
					<section className="flex min-h-[540px] flex-col p-3">
						<div className="text-muted-foreground">
							{area ? `${area} tools` : "All load-bearing tools"}
						</div>
						<div className="mt-1 flex items-center gap-1">
							<span className="text-muted-foreground">&gt;</span>
							<input
								ref={inputRef}
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								aria-label="Search tools"
								className="w-full bg-transparent caret-primary outline-none placeholder:text-muted-foreground/50"
								placeholder="type to search"
							/>
						</div>

						<div
							role="listbox"
							aria-label="Tools"
							tabIndex={-1}
							className="mt-3 grow"
						>
							{filtered.map((t, i) => (
								<div
									key={`${t.area}/${t.name}`}
									role="option"
									aria-selected={selected === t}
									onClick={() => setCursor(i)}
									onKeyDown={() => {}}
									className={cn(
										// Hover speaks the sidebar's language: letters brighten,
										// no rectangle. The rectangle means SELECTED.
										"group grid cursor-pointer grid-cols-[1fr_auto_auto] items-baseline gap-4 px-1",
										selected === t && "bg-accent",
									)}
								>
									<span className="truncate">
										<span className="text-muted-foreground group-hover:text-foreground">
											{t.area}/
										</span>
										<span
											className={
												selected === t
													? "text-accent-foreground"
													: "text-foreground group-hover:text-primary"
											}
										>
											{t.name}
										</span>
									</span>
									<span className="text-muted-foreground tabular-nums group-hover:text-foreground">
										since {t.since}
									</span>
									<span className="w-10 text-right text-muted-foreground tabular-nums group-hover:text-foreground">
										×{t.jobs}
									</span>
								</div>
							))}
							{filtered.length === 0 ? (
								<div className="px-1 text-muted-foreground">
									no matches — esc to clear
								</div>
							) : null}
						</div>

						{/* ── Detail line ── */}
						{selected ? (
							<div className="mt-3 border-border border-t pt-2">
								<div className="text-foreground">
									{selected.name} · since {selected.since} · ×{selected.jobs}{" "}
									engagements · {selected.note}
								</div>
								<div className="mt-1 flex gap-4 text-xs">
									{(Object.keys(STATUS_META) as Status[]).map((s) => (
										<span
											key={s}
											className={cn(
												STATUS_META[s].cls,
												selected.status !== s && "opacity-40",
											)}
										>
											{STATUS_META[s].dot} {STATUS_META[s].label}
										</span>
									))}
								</div>
							</div>
						) : null}
					</section>
				</div>

				{/* ── Hint bar ── */}
				<div className="border-border border-t px-3 py-1.5 text-muted-foreground text-xs">
					↑/↓ select · ←/→ area · type to search · esc clear
				</div>
			</Pane>
		</div>
	);
}
