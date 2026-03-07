import { cn } from "@/lib/utils";
import { formatDuration, formatTime } from "@/lib/admin-utils";

export interface LogEntry {
	id: number;
	taskName: string;
	status: string;
	durationMs: number | null;
	recordsUpserted: number | null;
	error: string | null;
	startedAt: Date | string;
}

export function SyncLogFeed({ logs }: { logs: LogEntry[] }) {
	return (
		<div className="panel-border rounded-[2px] overflow-hidden">
			<div className="p-3 border-b border-border-subtle">
				<span className="data-label">Recent Activity</span>
			</div>
			<div className="max-h-80 overflow-y-auto">
				{logs.map((log) => {
					const isError = log.status !== "success";
					return (
						<div
							key={log.id}
							className="flex items-center gap-3 px-3 py-1.5 border-b border-border-subtle last:border-0 hover:bg-secondary/30 transition-colors"
						>
							<span className="font-mono text-[10px] text-foreground-subtle tabular-nums shrink-0 w-16">
								{formatTime(log.startedAt)}
							</span>
							<span className="font-mono text-[10px] uppercase tracking-wide text-foreground-muted w-24 shrink-0">
								{log.taskName}
							</span>
							<span
								className={cn(
									"font-mono text-[10px] uppercase tracking-wide w-14 shrink-0",
									isError
										? "text-status-error"
										: "text-status-active",
								)}
							>
								{isError ? "FAIL" : "OK"}
							</span>
							<span className="font-mono text-[10px] text-foreground-subtle tabular-nums w-14 shrink-0 text-right">
								{formatDuration(log.durationMs)}
							</span>
							<span className="font-mono text-[10px] tabular-nums data-value w-10 shrink-0 text-right">
								{log.recordsUpserted ?? "-"}
							</span>
							{isError && log.error && (
								<span className="font-mono text-[10px] text-status-error truncate">
									{log.error}
								</span>
							)}
						</div>
					);
				})}
				{logs.length === 0 && (
					<div className="py-8 text-center text-foreground-subtle font-mono text-xs">
						No activity recorded
					</div>
				)}
			</div>
		</div>
	);
}
