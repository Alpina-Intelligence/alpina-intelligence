import type { Meta, StoryObj } from "@storybook/react-vite";
import { SyncStatusTable } from "./SyncStatusTable";
import type { TaskSummary, TaskConfig } from "./SyncStatusTable";

const now = new Date("2026-03-07T12:00:00Z");

function minutesAgo(m: number): string {
	return new Date(now.getTime() - m * 60_000).toISOString();
}

const defaultTasks: TaskSummary[] = [
	{ task_name: "scores", status: "success", duration_ms: 245, records_upserted: 12, error: null, started_at: minutesAgo(2) },
	{ task_name: "standings", status: "success", duration_ms: 890, records_upserted: 32, error: null, started_at: minutesAgo(5) },
	{ task_name: "rosters", status: "success", duration_ms: 3200, records_upserted: 180, error: null, started_at: minutesAgo(30) },
	{ task_name: "schedule", status: "success", duration_ms: 1500, records_upserted: 82, error: null, started_at: minutesAgo(10) },
	{ task_name: "player-stats", status: "success", duration_ms: 4500, records_upserted: 450, error: null, started_at: minutesAgo(15) },
	{ task_name: "advanced-stats", status: "success", duration_ms: 6200, records_upserted: 320, error: null, started_at: minutesAgo(20) },
];

const allEnabled: TaskConfig[] = [
	{ taskName: "scores", enabled: true },
	{ taskName: "standings", enabled: true },
	{ taskName: "rosters", enabled: true },
	{ taskName: "schedule", enabled: true },
	{ taskName: "player-stats", enabled: true },
	{ taskName: "advanced-stats", enabled: true },
];

const meta = {
	title: "Admin/SyncStatusTable",
	component: SyncStatusTable,
	parameters: {
		layout: "padded",
	},
} satisfies Meta<typeof SyncStatusTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		lastRunPerTask: defaultTasks,
		configs: allEnabled,
	},
};

export const WithErrors: Story = {
	args: {
		lastRunPerTask: [
			...defaultTasks.slice(0, 3),
			{ task_name: "schedule", status: "error", duration_ms: 800, records_upserted: null, error: "Connection timeout", started_at: minutesAgo(10) },
			{ task_name: "player-stats", status: "error", duration_ms: null, records_upserted: null, error: "Rate limit exceeded", started_at: minutesAgo(15) },
			defaultTasks[5],
		],
		configs: allEnabled,
	},
};

export const WithDisabledTasks: Story = {
	args: {
		lastRunPerTask: defaultTasks,
		configs: [
			{ taskName: "scores", enabled: true },
			{ taskName: "standings", enabled: true },
			{ taskName: "rosters", enabled: false },
			{ taskName: "schedule", enabled: true },
			{ taskName: "player-stats", enabled: false },
			{ taskName: "advanced-stats", enabled: false },
		],
	},
};

export const Empty: Story = {
	args: {
		lastRunPerTask: [],
		configs: allEnabled,
	},
};
