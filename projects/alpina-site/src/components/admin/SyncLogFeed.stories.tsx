import type { Meta, StoryObj } from "@storybook/react-vite";
import { SyncLogFeed } from "./SyncLogFeed";
import type { LogEntry } from "./SyncLogFeed";

const now = new Date("2026-03-07T12:00:00Z");

function minutesAgo(m: number): string {
	return new Date(now.getTime() - m * 60_000).toISOString();
}

const sampleLogs: LogEntry[] = [
	{ id: 1, taskName: "scores", status: "success", durationMs: 245, recordsUpserted: 12, error: null, startedAt: minutesAgo(1) },
	{ id: 2, taskName: "standings", status: "success", durationMs: 890, recordsUpserted: 32, error: null, startedAt: minutesAgo(3) },
	{ id: 3, taskName: "rosters", status: "error", durationMs: 3200, recordsUpserted: null, error: "Connection timeout", startedAt: minutesAgo(5) },
	{ id: 4, taskName: "schedule", status: "success", durationMs: 1500, recordsUpserted: 82, error: null, startedAt: minutesAgo(8) },
	{ id: 5, taskName: "player-stats", status: "success", durationMs: 4500, recordsUpserted: 450, error: null, startedAt: minutesAgo(12) },
	{ id: 6, taskName: "advanced-stats", status: "error", durationMs: 1200, recordsUpserted: null, error: "Rate limit exceeded", startedAt: minutesAgo(15) },
	{ id: 7, taskName: "scores", status: "success", durationMs: 210, recordsUpserted: 8, error: null, startedAt: minutesAgo(16) },
	{ id: 8, taskName: "standings", status: "success", durationMs: 780, recordsUpserted: 32, error: null, startedAt: minutesAgo(18) },
];

const meta = {
	title: "Admin/SyncLogFeed",
	component: SyncLogFeed,
	parameters: {
		layout: "padded",
	},
} satisfies Meta<typeof SyncLogFeed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { logs: sampleLogs },
};

export const WithErrors: Story = {
	args: {
		logs: sampleLogs.filter((l) => l.status === "error"),
	},
};

export const Empty: Story = {
	args: { logs: [] },
};
