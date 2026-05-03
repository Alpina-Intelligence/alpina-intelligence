import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { updateTaskConfig } from "@/lib/admin-fns";
import { TaskConfigCard } from "@/components/admin/TaskConfigCard";
import { adminKeys, dashboardQuery } from "@/lib/queries/admin";

export const Route = createFileRoute("/admin/configuration")({
	component: ConfigurationPage,
	loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery()),
});

function ConfigurationPage() {
	const queryClient = useQueryClient();
	const {
		data: { configs },
	} = useSuspenseQuery(dashboardQuery());

	const mutation = useMutation({
		mutationFn: (data: Record<string, unknown> & { taskName: string }) =>
			updateTaskConfig({ data }),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() }),
	});

	const taskOrder = [
		"scores",
		"standings",
		"rosters",
		"schedule",
		"player-stats",
		"advanced-stats",
	];
	const sorted = [...configs].sort(
		(a, b) =>
			taskOrder.indexOf(a.taskName) - taskOrder.indexOf(b.taskName),
	);

	return (
		<div className="min-h-screen bg-background relative overflow-hidden">
			<div className="fixed inset-0 grid-command pointer-events-none opacity-40" />
			<div className="fixed inset-0 scanlines pointer-events-none" />

			<div className="relative max-w-7xl mx-auto px-4 lg:px-8 pt-16 pb-8">
				{/* Header */}
				<div className="flex items-center gap-3 mb-6">
					<span className="data-label">//</span>
					<h1 className="font-mono text-xs uppercase tracking-ultra text-foreground-muted">
						Sync Engine Configuration
					</h1>
					<div className="flex-1 h-px bg-border" />
				</div>

				{/* Task Config Grid */}
				<div className="grid md:grid-cols-2 gap-4">
					{sorted.map((config) => (
						<TaskConfigCard
							key={config.taskName}
							config={config}
							onSave={mutation.mutate}
							saving={mutation.isPending}
						/>
					))}
				</div>

				{configs.length === 0 && (
					<div className="panel-border rounded-[2px] p-8 text-center">
						<p className="font-mono text-xs text-foreground-subtle">
							No task configuration found. Seed the
							nhl_sync_task_config table to get started.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
