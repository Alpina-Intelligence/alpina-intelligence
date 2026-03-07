import { describe, it, expect, vi } from "vitest";
import { batchProcess } from "./batch";

describe("batchProcess", () => {
	it("processes all items and returns results", async () => {
		const items = [1, 2, 3, 4, 5];
		const results = await batchProcess(items, async (n) => n * 2, 3);
		expect(results).toEqual([2, 4, 6, 8, 10]);
	});

	it("respects batch size", async () => {
		const concurrentCounts: number[] = [];
		let inFlight = 0;

		const items = [1, 2, 3, 4, 5];
		await batchProcess(
			items,
			async (n) => {
				inFlight++;
				concurrentCounts.push(inFlight);
				await new Promise((r) => setTimeout(r, 10));
				inFlight--;
				return n;
			},
			2,
		);

		// Max concurrent should never exceed batch size of 2
		expect(Math.max(...concurrentCounts)).toBeLessThanOrEqual(2);
	});

	it("calls onError for failed items and continues", async () => {
		const onError = vi.fn();
		const items = [1, 2, 3, 4];

		const results = await batchProcess(
			items,
			async (n) => {
				if (n === 2 || n === 4) throw new Error(`fail-${n}`);
				return n * 10;
			},
			4,
			onError,
		);

		expect(results).toEqual([10, 30]);
		expect(onError).toHaveBeenCalledTimes(2);
		expect(onError).toHaveBeenCalledWith(2, expect.any(Error));
		expect(onError).toHaveBeenCalledWith(4, expect.any(Error));
	});

	it("handles empty input", async () => {
		const results = await batchProcess([], async (n: number) => n, 5);
		expect(results).toEqual([]);
	});
});
