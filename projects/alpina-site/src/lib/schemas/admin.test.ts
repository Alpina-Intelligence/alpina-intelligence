import { describe, it, expect } from "vitest";
import {
	updateTaskConfigSchema,
	updateMaxConcurrencySchema,
	getSyncLogsSchema,
} from "./admin";

describe("updateTaskConfigSchema", () => {
	it("accepts a full object with all fields", () => {
		const result = updateTaskConfigSchema.safeParse({
			taskName: "scores",
			enabled: true,
			intervalLiveMs: 30_000,
			intervalGamedayMs: 300_000,
			intervalQuietMs: 3_600_000,
			intervalOffseasonMs: 7_200_000,
			batchSize: 50,
		});
		expect(result.success).toBe(true);
	});

	it("accepts minimal object with just taskName", () => {
		const result = updateTaskConfigSchema.safeParse({ taskName: "scores" });
		expect(result.success).toBe(true);
	});

	it("accepts batchSize as null", () => {
		const result = updateTaskConfigSchema.safeParse({
			taskName: "rosters",
			batchSize: null,
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing taskName", () => {
		const result = updateTaskConfigSchema.safeParse({
			enabled: true,
		});
		expect(result.success).toBe(false);
	});

	it("rejects intervalLiveMs of 0", () => {
		const result = updateTaskConfigSchema.safeParse({
			taskName: "scores",
			intervalLiveMs: 0,
		});
		expect(result.success).toBe(false);
	});

	it("rejects negative intervalLiveMs", () => {
		const result = updateTaskConfigSchema.safeParse({
			taskName: "scores",
			intervalLiveMs: -1,
		});
		expect(result.success).toBe(false);
	});

	it("rejects non-integer batchSize", () => {
		const result = updateTaskConfigSchema.safeParse({
			taskName: "scores",
			batchSize: 1.5,
		});
		expect(result.success).toBe(false);
	});
});

describe("updateMaxConcurrencySchema", () => {
	it("accepts a valid positive integer", () => {
		const result = updateMaxConcurrencySchema.safeParse({
			maxConcurrency: 4,
		});
		expect(result.success).toBe(true);
	});

	it("rejects zero", () => {
		const result = updateMaxConcurrencySchema.safeParse({
			maxConcurrency: 0,
		});
		expect(result.success).toBe(false);
	});

	it("rejects non-integer", () => {
		const result = updateMaxConcurrencySchema.safeParse({
			maxConcurrency: 2.5,
		});
		expect(result.success).toBe(false);
	});

	it("rejects missing field", () => {
		const result = updateMaxConcurrencySchema.safeParse({});
		expect(result.success).toBe(false);
	});
});

describe("getSyncLogsSchema", () => {
	it("accepts empty object", () => {
		const result = getSyncLogsSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it("accepts taskName filter", () => {
		const result = getSyncLogsSchema.safeParse({ taskName: "scores" });
		expect(result.success).toBe(true);
	});

	it("accepts taskName and limit", () => {
		const result = getSyncLogsSchema.safeParse({
			taskName: "scores",
			limit: 50,
		});
		expect(result.success).toBe(true);
	});

	it("rejects limit of 0", () => {
		const result = getSyncLogsSchema.safeParse({ limit: 0 });
		expect(result.success).toBe(false);
	});

	it("rejects negative limit", () => {
		const result = getSyncLogsSchema.safeParse({ limit: -5 });
		expect(result.success).toBe(false);
	});
});
