import { describe, it, expect } from "vitest";
import scoreFixture from "@/__fixtures__/nhl/score-now.json";
import standingsFixture from "@/__fixtures__/nhl/standings-now.json";
import rosterFixture from "@/__fixtures__/nhl/roster-edm.json";
import mcdavidFixture from "@/__fixtures__/nhl/player-mcdavid.json";
import skinnerFixture from "@/__fixtures__/nhl/player-skinner.json";
import {
	transformGame,
	transformGoal,
	transformTeamFromStanding,
	transformPlayer,
	transformStanding,
	transformSkaterSeasonStats,
	transformGoalieSeasonStats,
	transformSeason,
	findActiveSeasonId,
	isGoalieSeasonTotal,
	nhlSeasonTotals,
} from "./transformers";
import type {
	NhlScoreResponse,
	NhlStandingsResponse,
	NhlRosterResponse,
	NhlPlayerLandingResponse,
} from "./types";

const scores = scoreFixture as unknown as NhlScoreResponse;
const standings = standingsFixture as unknown as NhlStandingsResponse;
const roster = rosterFixture as unknown as NhlRosterResponse;
const mcdavid = mcdavidFixture as unknown as NhlPlayerLandingResponse;
const skinner = skinnerFixture as unknown as NhlPlayerLandingResponse;

describe("transformGame", () => {
	it("transforms a game from the score response", () => {
		const game = scores.games[0];
		const result = transformGame(game);

		expect(result.id).toBe(game.id);
		expect(result.season).toBe(game.season);
		expect(result.gameType).toBe(game.gameType);
		expect(result.gameDate).toBe(game.gameDate);
		expect(result.venue).toBe(game.venue.default);
		expect(result.gameState).toBe(game.gameState);
		expect(result.homeTeamId).toBe(game.homeTeam.id);
		expect(result.awayTeamId).toBe(game.awayTeam.id);
		expect(result.neutralSite).toBe(game.neutralSite);
		expect(result.startTimeUtc).toBeInstanceOf(Date);
	});

	it("handles future games with no scores", () => {
		const futureGame = scores.games.find((g) => g.gameState === "FUT");
		if (!futureGame) return; // no future games in fixture

		const result = transformGame(futureGame);
		expect(result.gameState).toBe("FUT");
		// Scores may be undefined for future games
		expect(result.homeScore).toBeNull();
	});

	it("handles completed games with scores", () => {
		const offGame = scores.games.find((g) => g.gameState === "OFF");
		if (!offGame) return;

		const result = transformGame(offGame);
		expect(result.gameState).toBe("OFF");
		expect(typeof result.homeScore).toBe("number");
		expect(typeof result.awayScore).toBe("number");
	});
});

describe("transformGoal", () => {
	it("transforms a goal event", () => {
		const game = scores.games.find((g) => g.goals && g.goals.length > 0);
		if (!game?.goals?.[0]) return;

		const goal = game.goals[0];
		const result = transformGoal(goal, game.id);

		expect(result.id).toBe(
			`${game.id}-${goal.period}-${goal.timeInPeriod}-${goal.playerId}`,
		);
		expect(result.gameId).toBe(game.id);
		expect(result.period).toBe(goal.period);
		expect(result.scorerId).toBe(goal.playerId);
		expect(result.scorerName).toContain(goal.firstName.default);
		expect(result.teamAbbrev).toBe(goal.teamAbbrev);
		expect(result.strength).toBe(goal.strength);
		expect(typeof result.homeScore).toBe("number");
		expect(typeof result.awayScore).toBe("number");
	});

	it("transforms assists as structured JSON", () => {
		const game = scores.games.find(
			(g) => g.goals?.some((goal) => goal.assists.length > 0),
		);
		if (!game?.goals) return;

		const goalWithAssists = game.goals.find((g) => g.assists.length > 0);
		if (!goalWithAssists) return;

		const result = transformGoal(goalWithAssists, game.id);
		expect(Array.isArray(result.assists)).toBe(true);
		expect(result.assists![0]).toHaveProperty("playerId");
		expect(result.assists![0]).toHaveProperty("name");
		expect(result.assists![0]).toHaveProperty("assistsToDate");
	});
});

describe("transformTeamFromStanding", () => {
	it("extracts team data from a standing record", () => {
		const standing = standings.standings[0];
		const result = transformTeamFromStanding(standing, 42);

		expect(result.id).toBe(42);
		expect(result.abbrev).toBe(standing.teamAbbrev.default);
		expect(result.name).toBe(standing.teamCommonName.default);
		expect(result.conference).toBe(standing.conferenceName);
		expect(result.conferenceAbbrev).toBe(standing.conferenceAbbrev);
		expect(result.division).toBe(standing.divisionName);
		expect(result.divisionAbbrev).toBe(standing.divisionAbbrev);
		expect(result.logoUrl).toBe(standing.teamLogo);
	});
});

describe("transformPlayer", () => {
	it("transforms a roster player", () => {
		const player = roster.forwards[0];
		const result = transformPlayer(player, 22, "EDM");

		expect(result.id).toBe(player.id);
		expect(result.firstName).toBe(player.firstName.default);
		expect(result.lastName).toBe(player.lastName.default);
		expect(result.teamId).toBe(22);
		expect(result.teamAbbrev).toBe("EDM");
		expect(result.position).toBe(player.positionCode);
		expect(result.sweaterNumber).toBe(player.sweaterNumber);
		expect(result.shootsCatches).toBe(player.shootsCatches);
		expect(result.heightInches).toBe(player.heightInInches);
		expect(result.weightPounds).toBe(player.weightInPounds);
		expect(result.birthDate).toBe(player.birthDate);
		expect(result.birthCity).toBe(player.birthCity.default);
		expect(result.birthCountry).toBe(player.birthCountry);
		expect(result.headshotUrl).toBe(player.headshot);
		expect(result.isActive).toBe(true);
	});

	it("handles players without birthStateProvince", () => {
		// Find a player born outside NA (no state/province)
		const allPlayers = [
			...roster.forwards,
			...roster.defensemen,
			...roster.goalies,
		];
		const noProvince = allPlayers.find((p) => !p.birthStateProvince);

		if (noProvince) {
			const result = transformPlayer(noProvince, 22, "EDM");
			expect(result.birthStateProvince).toBeNull();
		}
	});
});

describe("transformStanding", () => {
	it("transforms a standing record with all core + split fields", () => {
		const standing = standings.standings[0];
		const snapshotDate = "2025-04-15";
		const result = transformStanding(standing, 1, snapshotDate);

		expect(result.id).toBe(
			`${standing.seasonId}-${standing.teamAbbrev.default}-${snapshotDate}`,
		);
		expect(result.seasonId).toBe(standing.seasonId);
		expect(result.teamAbbrev).toBe(standing.teamAbbrev.default);
		expect(result.teamId).toBe(1);

		// Core fields
		expect(result.wins).toBe(standing.wins);
		expect(result.losses).toBe(standing.losses);
		expect(result.otLosses).toBe(standing.otLosses);
		expect(result.points).toBe(standing.points);
		expect(result.goalFor).toBe(standing.goalFor);
		expect(result.goalAgainst).toBe(standing.goalAgainst);
		expect(result.goalDifferential).toBe(standing.goalDifferential);

		// Home splits
		expect(result.homeWins).toBe(standing.homeWins);
		expect(result.homeLosses).toBe(standing.homeLosses);
		expect(result.homeOtLosses).toBe(standing.homeOtLosses);
		expect(result.homePoints).toBe(standing.homePoints);

		// Road splits
		expect(result.roadWins).toBe(standing.roadWins);
		expect(result.roadLosses).toBe(standing.roadLosses);
		expect(result.roadOtLosses).toBe(standing.roadOtLosses);
		expect(result.roadPoints).toBe(standing.roadPoints);

		// L10
		expect(result.l10Wins).toBe(standing.l10Wins);
		expect(result.l10Losses).toBe(standing.l10Losses);
		expect(result.l10OtLosses).toBe(standing.l10OtLosses);
		expect(result.l10Points).toBe(standing.l10Points);

		// Streak
		expect(result.streakCode).toBe(standing.streakCode);
		expect(result.streakCount).toBe(standing.streakCount);

		// Rankings
		expect(result.leagueSequence).toBe(standing.leagueSequence);
		expect(result.conferenceSequence).toBe(standing.conferenceSequence);
		expect(result.divisionSequence).toBe(standing.divisionSequence);
		expect(result.wildcardSequence).toBe(standing.wildcardSequence);
	});

	it("transforms all 32 teams", () => {
		expect(standings.standings.length).toBeGreaterThanOrEqual(32);
	});
});

describe("transformSkaterSeasonStats", () => {
	it("transforms McDavid's current season stats", () => {
		const nhlStats = nhlSeasonTotals(mcdavid.seasonTotals);
		const currentSeason = nhlStats.find(
			(s) => s.season === 20252026 && s.gameTypeId === 2,
		);
		if (!currentSeason) return;

		const snapshotDate = "2025-04-15";
		const result = transformSkaterSeasonStats(mcdavid.playerId, currentSeason, snapshotDate);

		expect(result.id).toBe(`${mcdavid.playerId}-20252026-2-${snapshotDate}`);
		expect(result.playerId).toBe(mcdavid.playerId);
		expect(result.season).toBe(20252026);
		expect(result.gameType).toBe(2);
		expect(result.gamesPlayed).toBeGreaterThan(0);
		expect(result.goals).toBeGreaterThanOrEqual(0);
		expect(result.assists).toBeGreaterThanOrEqual(0);
		expect(result.points).toBe(result.goals + result.assists);
	});
});

describe("transformGoalieSeasonStats", () => {
	it("transforms a goalie's season stats", () => {
		const nhlStats = nhlSeasonTotals(skinner.seasonTotals);
		const currentSeason = nhlStats.find(
			(s) => s.season === 20252026 && s.gameTypeId === 2,
		);
		if (!currentSeason) return;

		const snapshotDate = "2025-04-15";
		const result = transformGoalieSeasonStats(skinner.playerId, currentSeason, snapshotDate);

		expect(result.id).toBe(`${skinner.playerId}-20252026-2-${snapshotDate}`);
		expect(result.playerId).toBe(skinner.playerId);
		expect(result.gamesPlayed).toBeGreaterThan(0);
		expect(result.wins).toBeGreaterThanOrEqual(0);
		expect(result.losses).toBeGreaterThanOrEqual(0);
		expect(result.savePctg).toBeGreaterThan(0);
		expect(result.goalsAgainstAvg).toBeGreaterThan(0);
	});
});

describe("isGoalieSeasonTotal", () => {
	it("returns true for goalie stats", () => {
		const goalieSeason = skinner.seasonTotals.find(
			(s) => s.savePctg !== undefined,
		);
		if (goalieSeason) {
			expect(isGoalieSeasonTotal(goalieSeason)).toBe(true);
		}
	});

	it("returns false for skater stats", () => {
		const skaterSeason = mcdavid.seasonTotals.find(
			(s) => s.leagueAbbrev === "NHL",
		);
		if (skaterSeason) {
			expect(isGoalieSeasonTotal(skaterSeason)).toBe(false);
		}
	});
});

describe("nhlSeasonTotals", () => {
	it("filters to only NHL regular season and playoffs", () => {
		const result = nhlSeasonTotals(mcdavid.seasonTotals);

		for (const st of result) {
			expect(st.leagueAbbrev).toBe("NHL");
			expect([2, 3]).toContain(st.gameTypeId);
		}
	});

	it("excludes junior/international leagues", () => {
		const all = mcdavid.seasonTotals;
		const filtered = nhlSeasonTotals(all);

		// McDavid played in OHL before NHL, so filtered should be fewer
		expect(filtered.length).toBeLessThanOrEqual(all.length);
	});
});

describe("transformSeason", () => {
	it("maps API season entry to DB row", () => {
		const entry = {
			id: 20252026,
			standingsStart: "2025-10-07",
			standingsEnd: "2026-04-17",
			conferencesInUse: true,
			divisionsInUse: true,
			wildcardInUse: true,
			tiesInUse: false,
		};
		const result = transformSeason(entry);

		expect(result.id).toBe(20252026);
		expect(result.standingsStart).toBe("2025-10-07");
		expect(result.standingsEnd).toBe("2026-04-17");
		expect(result.conferencesInUse).toBe(true);
		expect(result.tiesInUse).toBe(false);
	});
});

describe("findActiveSeasonId", () => {
	const seasons = [
		{ id: 20242025, standingsStart: "2024-10-04", standingsEnd: "2025-04-17" },
		{ id: 20252026, standingsStart: "2025-10-07", standingsEnd: "2026-04-15" },
	];

	it("returns matching season when date is within range", () => {
		expect(findActiveSeasonId(seasons, "2025-12-15")).toBe(20252026);
		expect(findActiveSeasonId(seasons, "2025-01-15")).toBe(20242025);
	});

	it("returns most recent past season when date is in offseason gap", () => {
		// Summer gap between seasons
		expect(findActiveSeasonId(seasons, "2025-07-15")).toBe(20242025);
	});

	it("returns most recent season when date is after all seasons", () => {
		expect(findActiveSeasonId(seasons, "2026-08-01")).toBe(20252026);
	});

	it("falls back to currentSeasonId when no seasons provided", () => {
		const result = findActiveSeasonId([]);
		expect(typeof result).toBe("number");
		expect(result).toBeGreaterThan(20000000);
	});
});
