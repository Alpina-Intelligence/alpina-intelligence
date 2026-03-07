import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameStateIndicator } from "@/components/admin/GameStateIndicator";
import { SyncStatusTable } from "@/components/admin/SyncStatusTable";
import { SyncLogFeed } from "@/components/admin/SyncLogFeed";
import { adminKeys, dashboardQuery } from "@/lib/queries/admin";

export const Route = createFileRoute("/admin/monitoring")({
	component: MonitoringPage,
	loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery()),
});

function formatUptime(startedAt: string | null): string {
	if (!startedAt) return "unknown";
	const diff = Date.now() - new Date(startedAt).getTime();
	const hours = Math.floor(diff / 3_600_000);
	const mins = Math.floor((diff % 3_600_000) / 60_000);
	if (hours > 0) return `${hours}h ${mins}m`;
	return `${mins}m`;
}

function MonitoringPage() {
	const queryClient = useQueryClient();
	const { data: { configs, recentLogs, lastRunPerTask, engineState } } =
		useSuspenseQuery({ ...dashboardQuery(), refetchInterval: 15_000 });

	return (
		<div className="min-h-screen bg-background relative overflow-hidden">
			<div className="fixed inset-0 grid-command pointer-events-none opacity-40" />
			<div className="fixed inset-0 scanlines pointer-events-none" />

			<div className="relative max-w-7xl mx-auto px-4 lg:px-8 pt-16 pb-8">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<span className="data-label">//</span>
						<h1 className="font-mono text-xs uppercase tracking-ultra text-foreground-muted">
							Sync Engine Monitoring
						</h1>
						<div className="flex-1 h-px bg-border" />
					</div>
					<div className="flex items-center gap-4">
						<GameStateIndicator
							state={engineState?.gameState ?? null}
						/>
						<span className="text-border">|</span>
						<span className="font-mono text-[10px] text-foreground-subtle uppercase tracking-wide">
							Uptime:{" "}
							<span className="data-value">
								{formatUptime(
									engineState?.startedAt?.toString() ?? null,
								)}
							</span>
						</span>
						<Button
							variant="ghost"
							size="xs"
							onClick={() =>
								queryClient.invalidateQueries({
									queryKey: adminKeys.dashboard(),
								})
							}
							title="Refresh"
						>
							<RefreshCw className="w-3 h-3" />
						</Button>
					</div>
				</div>

				{/* Task Status */}
				<div className="space-y-4">
					<SyncStatusTable
						lastRunPerTask={lastRunPerTask}
						configs={configs}
					/>
					<SyncLogFeed logs={recentLogs} />
				</div>
			</div>
		</div>
	);
}
