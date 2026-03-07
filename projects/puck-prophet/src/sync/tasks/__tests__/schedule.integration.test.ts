import { describe, it, expect, vi, beforeEach } from "vitest";
import { nhlGames, nhlSyncLog } from "@/db/nhl-schema";
import { createMockCtx } from "./helpers/mock-ctx";
import scheduleFixture from "@/__fixtures__/nhl/schedule-now.json";
import type { NhlScheduleResponse } from "@/lib/nhl-api/types";

vi.mock("@/lib/nhl-api", () => ({
	nhlFetch: vi.fn(),
	endpoints: {
		schedule: {
			now: vi.fn().mockReturnValue("https://mock/schedule/now"),
		},
	},
}));

import { nhlFetch } from "@/lib/nhl-api";
const mockNhlFetch = vi.mocked(nhlFetch);

const fixtureData = scheduleFixture as unknown as NhlScheduleResponse;

describe("schedule task integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("fetches from the schedule endpoint", async () => {
		const { scheduleTask } = await import("../schedule");
		mockNhlFetch.mockResolvedValue({
			data: { ...fixtureData, gameWeek: [] },
			raw: "{}",
		});
		const { ctx } = createMockCtx();

		await scheduleTask.run(ctx);

		expect(mockNhlFetch).toHaveBeenCalledWith("https://mock/schedule/now");
	});

	it("upserts games from all days in gameWeek", async () => {
		const { scheduleTask } = await import("../schedule");
		mockNhlFetch.mockResolvedValue({
			data: fixtureData,
			raw: JSON.stringify(fixtureData),
		});
		const { ctx, insertsFor } = createMockCtx();

		await scheduleTask.run(ctx);

		const gameInserts = insertsFor(nhlGames);
		const totalGames = fixtureData.gameWeek.reduce(
			(sum, day) => sum + day.games.length,
			0,
		);
		expect(gameInserts).toHaveLength(totalGames);
	});

	it("conflict set only updates scheduling fields, not scores", async () => {
		const { scheduleTask } = await import("../schedule");
		// Ensure fixture has at least one game
		if (fixtureData.gameWeek[0]?.games.length === 0) return;

		mockNhlFetch.mockResolvedValue({ data: fixtureData, raw: "{}" });
		const { ctx, insertsFor } = createMockCtx();

		await scheduleTask.run(ctx);

		const inserts = insertsFor(nhlGames);
		const conflictSet = inserts[0].onConflict!.set;
		// Schedule task only updates scheduling fields
		expect(conflictSet).toHaveProperty("gameDate");
		expect(conflictSet).toHaveProperty("startTimeUtc");
		expect(conflictSet).toHaveProperty("venue");
		expect(conflictSet).toHaveProperty("gameState");
		// Should NOT have score/period fields
		expect(conflictSet).not.toHaveProperty("homeScore");
		expect(conflictSet).not.toHaveProperty("period");
		expect(conflictSet).not.toHaveProperty("clock");
	});

	it("returns count of upserted games", async () => {
		const { scheduleTask } = await import("../schedule");
		mockNhlFetch.mockResolvedValue({ data: fixtureData, raw: "{}" });
		const { ctx } = createMockCtx();

		const result = await scheduleTask.run(ctx);

		const totalGames = fixtureData.gameWeek.reduce(
			(sum, day) => sum + day.games.length,
			0,
		);
		expect(result).toBe(totalGames);
	});

	it("handles empty schedule gracefully", async () => {
		const { scheduleTask } = await import("../schedule");
		mockNhlFetch.mockResolvedValue({
			data: { ...fixtureData, gameWeek: [] },
			raw: "{}",
		});
		const { ctx, insertsFor } = createMockCtx();

		const result = await scheduleTask.run(ctx);

		expect(result).toBe(0);
		const logInserts = insertsFor(nhlSyncLog);
		expect(logInserts).toHaveLength(1);
		expect(logInserts[0].values).toMatchObject({
			taskName: "schedule",
			status: "success",
			recordsUpserted: 0,
		});
	});
});
