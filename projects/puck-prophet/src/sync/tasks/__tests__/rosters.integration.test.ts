import { describe, it, expect, vi, beforeEach } from "vitest";
import { nhlTeams, nhlPlayers, nhlSyncLog } from "@/db/nhl-schema";
import { createMockCtx } from "./helpers/mock-ctx";
import rosterFixture from "@/__fixtures__/nhl/roster-edm.json";
import type { NhlRosterResponse } from "@/lib/nhl-api/types";

vi.mock("@/lib/nhl-api", () => ({
	nhlFetch: vi.fn(),
	endpoints: {
		roster: {
			current: vi
				.fn()
				.mockImplementation(
					(abbrev: string) => `https://mock/roster/${abbrev}/current`,
				),
		},
	},
}));

import { nhlFetch } from "@/lib/nhl-api";
const mockNhlFetch = vi.mocked(nhlFetch);

const edmRoster = rosterFixture as unknown as NhlRosterResponse;
const emptyRoster = { forwards: [], defensemen: [], goalies: [] };

describe("rosters task integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("fetches roster for all 32 teams", async () => {
		const { rostersTask } = await import("../rosters");
		mockNhlFetch.mockResolvedValue({ data: emptyRoster, raw: "{}" });
		const { ctx } = createMockCtx();

		await rostersTask.run(ctx);

		expect(mockNhlFetch).toHaveBeenCalledTimes(32);
	});

	it("upserts players with correct teamId when team exists in DB", async () => {
		const { rostersTask } = await import("../rosters");
		mockNhlFetch.mockImplementation(async (url) => {
			if (typeof url === "string" && url.includes("/EDM/")) {
				return { data: edmRoster, raw: JSON.stringify(edmRoster) };
			}
			return { data: emptyRoster, raw: "{}" };
		});

		const { ctx, insertsFor } = createMockCtx({
			selectData: new Map([
				[nhlTeams, [{ id: 22, abbrev: "EDM", name: "Oilers" }]],
			]),
		});

		await rostersTask.run(ctx);

		const playerInserts = insertsFor(nhlPlayers);
		const allEdmPlayers = [
			...edmRoster.forwards,
			...edmRoster.defensemen,
			...edmRoster.goalies,
		];
		expect(playerInserts).toHaveLength(allEdmPlayers.length);
		expect(playerInserts[0].values).toHaveProperty("teamId", 22);
		expect(playerInserts[0].values).toHaveProperty("teamAbbrev", "EDM");
	});

	it("skips teams not in DB with console.warn", async () => {
		const { rostersTask } = await import("../rosters");
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		mockNhlFetch.mockResolvedValue({ data: edmRoster, raw: "{}" });
		const { ctx, insertsFor } = createMockCtx({
			selectData: new Map([[nhlTeams, []]]),
		});

		await rostersTask.run(ctx);

		expect(insertsFor(nhlPlayers)).toHaveLength(0);
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	it("continues after per-team fetch errors", async () => {
		const { rostersTask } = await import("../rosters");
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		let callCount = 0;
		mockNhlFetch.mockImplementation(async () => {
			callCount++;
			if (callCount === 1) throw new Error("Network timeout");
			return { data: emptyRoster, raw: "{}" };
		});
		const { ctx } = createMockCtx();

		// Should not throw despite first team failing
		await expect(rostersTask.run(ctx)).resolves.not.toThrow();
		expect(mockNhlFetch).toHaveBeenCalledTimes(32);
		expect(errorSpy).toHaveBeenCalled();
		errorSpy.mockRestore();
	});

	it("returns total upserted player count", async () => {
		const { rostersTask } = await import("../rosters");
		mockNhlFetch.mockImplementation(async (url) => {
			if (typeof url === "string" && url.includes("/EDM/")) {
				return { data: edmRoster, raw: "{}" };
			}
			return { data: emptyRoster, raw: "{}" };
		});

		const { ctx } = createMockCtx({
			selectData: new Map([
				[nhlTeams, [{ id: 22, abbrev: "EDM" }]],
			]),
		});

		const result = await rostersTask.run(ctx);

		const expected =
			edmRoster.forwards.length +
			edmRoster.defensemen.length +
			edmRoster.goalies.length;
		expect(result).toBe(expected);
	});

	it("writes sync log on completion", async () => {
		const { rostersTask } = await import("../rosters");
		mockNhlFetch.mockResolvedValue({ data: emptyRoster, raw: "{}" });
		const { ctx, insertsFor } = createMockCtx();

		await rostersTask.run(ctx);

		const logInserts = insertsFor(nhlSyncLog);
		expect(logInserts).toHaveLength(1);
		expect(logInserts[0].values).toMatchObject({
			taskName: "rosters",
			status: "success",
		});
	});
});
