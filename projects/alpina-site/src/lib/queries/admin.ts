import { queryOptions } from "@tanstack/react-query";
import { getSyncDashboard, getSyncLogs } from "@/lib/admin-fns";

export const adminKeys = {
	all: ["admin"] as const,
	dashboard: () => [...adminKeys.all, "dashboard"] as const,
	logs: (filter?: { taskName?: string }) =>
		[...adminKeys.all, "logs", filter] as const,
};

export const dashboardQuery = () =>
	queryOptions({
		queryKey: adminKeys.dashboard(),
		queryFn: () => getSyncDashboard(),
	});

export const logsQuery = (filter?: { taskName?: string; limit?: number }) =>
	queryOptions({
		queryKey: adminKeys.logs(filter),
		queryFn: () => getSyncLogs({ data: filter ?? {} }),
	});
