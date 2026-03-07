export type TimeUnit = "s" | "m" | "h";

export const UNIT_MS: Record<TimeUnit, number> = {
	s: 1_000,
	m: 60_000,
	h: 3_600_000,
};

export function msToParts(ms: number): { value: string; unit: TimeUnit } {
	if (ms >= 3_600_000 && ms % 3_600_000 === 0)
		return { value: String(ms / 3_600_000), unit: "h" };
	if (ms >= 60_000 && ms % 60_000 === 0)
		return { value: String(ms / 60_000), unit: "m" };
	return { value: String(ms / 1_000), unit: "s" };
}

export function formatDuration(ms: number | null): string {
	if (ms === null) return "-";
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
}

export function formatTime(d: Date | string): string {
	const date = typeof d === "string" ? new Date(d) : d;
	return date.toLocaleTimeString("en-US", {
		hour12: false,
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

export function timeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.floor(hours / 24)}d ago`;
}
