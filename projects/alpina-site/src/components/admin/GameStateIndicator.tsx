import { cn } from "@/lib/utils";

const stateConfig = {
	live: { label: "LIVE", color: "text-status-active" },
	gameday: { label: "GAMEDAY", color: "text-status-pending" },
	quiet: { label: "QUIET", color: "text-foreground-muted" },
	offseason: { label: "OFFSEASON", color: "text-foreground-subtle" },
} as const;

type GameState = keyof typeof stateConfig;

export function GameStateIndicator({
	state,
}: {
	state: string | null;
}) {
	const config = stateConfig[(state as GameState) ?? "quiet"] ?? stateConfig.quiet;

	return (
		<span className="flex items-center gap-2">
			<span
				className={cn(
					"status-dot",
					config.color,
					state === "live" && "status-dot-pulse",
				)}
			/>
			<span className={cn("font-mono text-xs uppercase tracking-wide", config.color)}>
				{config.label}
			</span>
		</span>
	);
}
