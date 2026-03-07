import { cn } from "@/lib/utils";
import { formatDuration, formatTime, timeAgo } from "@/lib/admin-utils";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export interface TaskSummary {
	task_name: string;
	status: string;
	duration_ms: number | null;
	records_upserted: number | null;
	error: string | null;
	started_at: string;
}

export interface TaskConfig {
	taskName: string;
	enabled: boolean;
}

export function SyncStatusTable({
	lastRunPerTask,
	configs,
}: {
	lastRunPerTask: TaskSummary[];
	configs: TaskConfig[];
}) {
	const configMap = new Map(configs.map((c) => [c.taskName, c]));

	// Sort by task name for consistent ordering
	const taskOrder = [
		"scores",
		"standings",
		"rosters",
		"schedule",
		"player-stats",
		"advanced-stats",
	];
	const sorted = [...lastRunPerTask].sort(
		(a, b) =>
			taskOrder.indexOf(a.task_name) - taskOrder.indexOf(b.task_name),
	);

	return (
		<div className="panel-border rounded-[2px] overflow-hidden">
			<div className="p-3 border-b border-border-subtle">
				<span className="data-label">Task Status</span>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="font-mono text-[10px] uppercase tracking-wide">
							Task
						</TableHead>
						<TableHead className="font-mono text-[10px] uppercase tracking-wide">
							Status
						</TableHead>
						<TableHead className="font-mono text-[10px] uppercase tracking-wide">
							Last Run
						</TableHead>
						<TableHead className="font-mono text-[10px] uppercase tracking-wide text-right">
							Duration
						</TableHead>
						<TableHead className="font-mono text-[10px] uppercase tracking-wide text-right">
							Records
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{sorted.map((task) => {
						const config = configMap.get(task.task_name);
						const isError = task.status !== "success";
						return (
							<TableRow key={task.task_name}>
								<TableCell className="font-mono text-xs">
									<span className="flex items-center gap-2">
										{task.task_name}
										{config && !config.enabled && (
											<Badge
												variant="outline"
												className="text-[9px] px-1 py-0 text-foreground-subtle"
											>
												OFF
											</Badge>
										)}
									</span>
								</TableCell>
								<TableCell>
									<span
										className={cn(
											"inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide",
											isError
												? "text-status-error"
												: "text-status-active",
										)}
									>
										<span
											className={cn(
												"status-dot",
												isError
													? "text-status-error"
													: "text-status-active",
											)}
										/>
										{task.status}
									</span>
								</TableCell>
								<TableCell className="font-mono text-xs text-foreground-muted">
									<span title={formatTime(task.started_at)}>
										{timeAgo(task.started_at)}
									</span>
								</TableCell>
								<TableCell className="font-mono text-xs text-right tabular-nums text-foreground-muted">
									{formatDuration(task.duration_ms)}
								</TableCell>
								<TableCell className="font-mono text-xs text-right tabular-nums data-value">
									{task.records_upserted ?? "-"}
								</TableCell>
							</TableRow>
						);
					})}
					{sorted.length === 0 && (
						<TableRow>
							<TableCell
								colSpan={5}
								className="text-center text-foreground-subtle font-mono text-xs py-8"
							>
								No sync data available
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
