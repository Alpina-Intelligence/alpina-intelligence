import { describe, it, expect, vi, afterEach } from "vitest";
import { msToParts, formatDuration, timeAgo } from "./admin-utils";

describe("msToParts", () => {
	it("converts exact hours", () => {
		expect(msToParts(3_600_000)).toEqual({ value: "1", unit: "h" });
		expect(msToParts(7_200_000)).toEqual({ value: "2", unit: "h" });
	});

	it("converts exact minutes", () => {
		expect(msToParts(60_000)).toEqual({ value: "1", unit: "m" });
		expect(msToParts(300_000)).toEqual({ value: "5", unit: "m" });
	});

	it("converts to seconds as default", () => {
		expect(msToParts(1_000)).toEqual({ value: "1", unit: "s" });
		expect(msToParts(30_000)).toEqual({ value: "30", unit: "s" });
	});

	it("falls back to seconds when not evenly divisible by minutes", () => {
		// 90_000 ms = 1.5 minutes, not evenly divisible by 60_000
		expect(msToParts(90_000)).toEqual({ value: "90", unit: "s" });
	});

	it("falls back to minutes when not evenly divisible by hours", () => {
		// 5_400_000 ms = 1.5 hours = 90 minutes
		expect(msToParts(5_400_000)).toEqual({ value: "90", unit: "m" });
	});
});

describe("formatDuration", () => {
	it("returns dash for null", () => {
		expect(formatDuration(null)).toBe("-");
	});

	it("formats sub-second as milliseconds", () => {
		expect(formatDuration(500)).toBe("500ms");
		expect(formatDuration(999)).toBe("999ms");
	});

	it("formats seconds with one decimal", () => {
		expect(formatDuration(1000)).toBe("1.0s");
		expect(formatDuration(1500)).toBe("1.5s");
		expect(formatDuration(12345)).toBe("12.3s");
	});
});

describe("timeAgo", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns 'just now' for recent timestamps", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-03-07T12:00:00Z"));
		expect(timeAgo("2026-03-07T11:59:30Z")).toBe("just now");
	});

	it("returns minutes ago", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-03-07T12:00:00Z"));
		expect(timeAgo("2026-03-07T11:55:00Z")).toBe("5m ago");
	});

	it("returns hours ago", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-03-07T12:00:00Z"));
		expect(timeAgo("2026-03-07T10:00:00Z")).toBe("2h ago");
	});

	it("returns days ago", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-03-07T12:00:00Z"));
		expect(timeAgo("2026-03-06T11:00:00Z")).toBe("1d ago");
	});
});
