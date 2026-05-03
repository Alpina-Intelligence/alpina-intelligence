import { describe, it, expect } from "vitest";
import * as ep from "./endpoints";

describe("scores endpoints", () => {
	it("builds score/now URL", () => {
		expect(ep.scores.now()).toBe(
			"https://api-web.nhle.com/v1/score/now",
		);
	});

	it("builds score by date URL", () => {
		expect(ep.scores.byDate("2026-02-28")).toBe(
			"https://api-web.nhle.com/v1/score/2026-02-28",
		);
	});
});

describe("standings endpoints", () => {
	it("builds standings/now URL", () => {
		expect(ep.standings.now()).toBe(
			"https://api-web.nhle.com/v1/standings/now",
		);
	});
});

describe("roster endpoints", () => {
	it("builds current roster URL", () => {
		expect(ep.roster.current("EDM")).toBe(
			"https://api-web.nhle.com/v1/roster/EDM/current",
		);
	});

	it("builds roster by season URL", () => {
		expect(ep.roster.bySeason("CGY", 20252026)).toBe(
			"https://api-web.nhle.com/v1/roster/CGY/20252026",
		);
	});
});

describe("player endpoints", () => {
	it("builds player landing URL", () => {
		expect(ep.player.landing(8478402)).toBe(
			"https://api-web.nhle.com/v1/player/8478402/landing",
		);
	});

	it("builds game log URL", () => {
		expect(ep.player.gameLog(8478402, 20252026, 2)).toBe(
			"https://api-web.nhle.com/v1/player/8478402/game-log/20252026/2",
		);
	});
});

describe("schedule endpoints", () => {
	it("builds schedule/now URL", () => {
		expect(ep.schedule.now()).toBe(
			"https://api-web.nhle.com/v1/schedule/now",
		);
	});

	it("builds club season schedule URL", () => {
		expect(ep.schedule.clubSeason("TOR")).toBe(
			"https://api-web.nhle.com/v1/club-schedule-season/TOR/now",
		);
	});
});

describe("stats endpoints (cayenneExp)", () => {
	it("builds skater summary with default params", () => {
		const url = ep.stats.skaterSummary({ season: 20252026 });
		expect(url).toContain("api.nhle.com/stats/rest/en/skater/summary");
		expect(url).toContain("cayenneExp=seasonId%3D20252026");
		expect(url).toContain("limit=100");
		expect(url).toContain("start=0");
	});

	it("builds skater summary with sort DESC", () => {
		const url = ep.stats.skaterSummary({
			season: 20252026,
			limit: 5,
			sort: "points",
			dir: "DESC",
		});
		expect(url).toContain("limit=5");
		// Sort should be JSON array with DESC direction
		expect(url).toContain(
			encodeURIComponent('[{"property":"points","direction":"DESC"}]'),
		);
	});

	it("builds goalie summary with sort", () => {
		const url = ep.stats.goalieSummary({
			season: 20252026,
			limit: 10,
			sort: "wins",
		});
		expect(url).toContain("api.nhle.com/stats/rest/en/goalie/summary");
		expect(url).toContain("limit=10");
		// Default dir should be DESC
		expect(url).toContain(
			encodeURIComponent('[{"property":"wins","direction":"DESC"}]'),
		);
	});
});

describe("statsReport endpoints", () => {
	it("builds skater report URL with seasonId and gameTypeId", () => {
		const url = ep.statsReport.skater("realtime", {
			seasonId: 20252026,
			gameTypeId: 2,
		});
		expect(url).toContain("api.nhle.com/stats/rest/en/skater/realtime");
		expect(url).toContain("cayenneExp=seasonId%3D20252026+and+gameTypeId%3D2");
		expect(url).toContain("limit=100");
		expect(url).toContain("start=0");
	});

	it("builds goalie report URL with custom pagination", () => {
		const url = ep.statsReport.goalie("advanced", {
			seasonId: 20242025,
			gameTypeId: 3,
			limit: 50,
			start: 100,
		});
		expect(url).toContain("api.nhle.com/stats/rest/en/goalie/advanced");
		expect(url).toContain("cayenneExp=seasonId%3D20242025+and+gameTypeId%3D3");
		expect(url).toContain("limit=50");
		expect(url).toContain("start=100");
	});

	it("supports all skater report types", () => {
		const reports = [
			"realtime",
			"percentages",
			"scoringRates",
			"goalsForAgainst",
			"faceoffpercentages",
			"powerplay",
			"penaltykill",
		];
		for (const report of reports) {
			const url = ep.statsReport.skater(report, {
				seasonId: 20252026,
				gameTypeId: 2,
			});
			expect(url).toContain(`/en/skater/${report}?`);
		}
	});

	it("supports all goalie report types", () => {
		const reports = ["advanced", "savesByStrength"];
		for (const report of reports) {
			const url = ep.statsReport.goalie(report, {
				seasonId: 20252026,
				gameTypeId: 2,
			});
			expect(url).toContain(`/en/goalie/${report}?`);
		}
	});
});

describe("season endpoints", () => {
	it("builds season list URL", () => {
		expect(ep.season.list()).toBe(
			"https://api-web.nhle.com/v1/season",
		);
	});

	it("builds standings-season URL", () => {
		expect(ep.season.standingsSeason()).toBe(
			"https://api-web.nhle.com/v1/standings-season",
		);
	});
});
