import {
	nhlSkaterAdvancedStats,
	nhlGoalieAdvancedStats,
	nhlSyncLog,
} from "@/db/nhl-schema";
import { nhlFetch, endpoints } from "@/lib/nhl-api";
import type { NhlStatsRestResponse } from "@/lib/nhl-api/types";
import {
	currentSeasonId,
	transformSkaterRealtime,
	transformSkaterPercentages,
	transformSkaterScoringRates,
	transformSkaterGoalsForAgainst,
	transformSkaterFaceoffs,
	transformSkaterPowerplay,
	transformSkaterPenaltykill,
	transformGoalieAdvanced,
	transformGoalieSavesByStrength,
} from "@/lib/nhl-api/transformers";
import type { SyncTask, SyncContext } from "../scheduler";
import { intervals } from "../scheduler";

const PAGE_SIZE = 100;

async function fetchAllPages<T>(
	buildUrl: (start: number) => string,
): Promise<T[]> {
	const all: T[] = [];
	let start = 0;
	while (true) {
		const { data } =
			await nhlFetch<NhlStatsRestResponse<T>>(buildUrl(start));
		all.push(...data.data);
		if (data.data.length < PAGE_SIZE) break;
		start += PAGE_SIZE;
	}
	return all;
}

// Each skater report config: report name, transformer, and conflict set builder
const SKATER_REPORTS = [
	{
		report: "realtime",
		transform: transformSkaterRealtime,
		conflictSet: (r: typeof nhlSkaterAdvancedStats.$inferInsert) => ({
			gamesPlayed: r.gamesPlayed,
			positionCode: r.positionCode,
			teamAbbrevs: r.teamAbbrevs,
			hits: r.hits,
			hitsPer60: r.hitsPer60,
			blockedShots: r.blockedShots,
			blockedShotsPer60: r.blockedShotsPer60,
			missedShots: r.missedShots,
			giveaways: r.giveaways,
			giveawaysPer60: r.giveawaysPer60,
			takeaways: r.takeaways,
			takeawaysPer60: r.takeawaysPer60,
			emptyNetGoals: r.emptyNetGoals,
			emptyNetAssists: r.emptyNetAssists,
			emptyNetPoints: r.emptyNetPoints,
			firstGoals: r.firstGoals,
			otGoals: r.otGoals,
			shotAttemptsBlocked: r.shotAttemptsBlocked,
			totalShotAttempts: r.totalShotAttempts,
			timeOnIcePerGame: r.timeOnIcePerGame,
			updatedAt: new Date(),
		}),
	},
	{
		report: "percentages",
		transform: transformSkaterPercentages,
		conflictSet: (r: typeof nhlSkaterAdvancedStats.$inferInsert) => ({
			gamesPlayed: r.gamesPlayed,
			positionCode: r.positionCode,
			teamAbbrevs: r.teamAbbrevs,
			satPercentage: r.satPercentage,
			satPercentageAhead: r.satPercentageAhead,
			satPercentageBehind: r.satPercentageBehind,
			satPercentageTied: r.satPercentageTied,
			satPercentageClose: r.satPercentageClose,
			satRelative: r.satRelative,
			usatPercentage: r.usatPercentage,
			usatPercentageAhead: r.usatPercentageAhead,
			usatPercentageBehind: r.usatPercentageBehind,
			usatPercentageTied: r.usatPercentageTied,
			usatPercentageClose: r.usatPercentageClose,
			usatRelative: r.usatRelative,
			shootingPct5v5: r.shootingPct5v5,
			skaterSavePct5v5: r.skaterSavePct5v5,
			skaterShootingPlusSavePct5v5: r.skaterShootingPlusSavePct5v5,
			zoneStartPct5v5: r.zoneStartPct5v5,
			timeOnIcePerGame5v5: r.timeOnIcePerGame5v5,
			updatedAt: new Date(),
		}),
	},
	{
		report: "scoringRates",
		transform: transformSkaterScoringRates,
		conflictSet: (r: typeof nhlSkaterAdvancedStats.$inferInsert) => ({
			gamesPlayed: r.gamesPlayed,
			positionCode: r.positionCode,
			teamAbbrevs: r.teamAbbrevs,
			goals5v5: r.goals5v5,
			goalsPer605v5: r.goalsPer605v5,
			assists5v5: r.assists5v5,
			assistsPer605v5: r.assistsPer605v5,
			points5v5: r.points5v5,
			pointsPer605v5: r.pointsPer605v5,
			primaryAssists5v5: r.primaryAssists5v5,
			primaryAssistsPer605v5: r.primaryAssistsPer605v5,
			secondaryAssists5v5: r.secondaryAssists5v5,
			secondaryAssistsPer605v5: r.secondaryAssistsPer605v5,
			offensiveZoneStartPct5v5: r.offensiveZoneStartPct5v5,
			onIceShootingPct5v5: r.onIceShootingPct5v5,
			netMinorPenaltiesPer60: r.netMinorPenaltiesPer60,
			updatedAt: new Date(),
		}),
	},
	{
		report: "goalsForAgainst",
		transform: transformSkaterGoalsForAgainst,
		conflictSet: (r: typeof nhlSkaterAdvancedStats.$inferInsert) => ({
			gamesPlayed: r.gamesPlayed,
			positionCode: r.positionCode,
			teamAbbrevs: r.teamAbbrevs,
			esGoalsFor: r.esGoalsFor,
			esGoalsAgainst: r.esGoalsAgainst,
			esGoalDifference: r.esGoalDifference,
			esGoalsForPct: r.esGoalsForPct,
			esToiPerGame: r.esToiPerGame,
			ppGoalsFor: r.ppGoalsFor,
			ppGoalsAgainst: r.ppGoalsAgainst,
			ppToiPerGame: r.ppToiPerGame,
			shGoalsFor: r.shGoalsFor,
			shGoalsAgainst: r.shGoalsAgainst,
			shToiPerGame: r.shToiPerGame,
			updatedAt: new Date(),
		}),
	},
	{
		report: "faceoffpercentages",
		transform: transformSkaterFaceoffs,
		conflictSet: (r: typeof nhlSkaterAdvancedStats.$inferInsert) => ({
			gamesPlayed: r.gamesPlayed,
			positionCode: r.positionCode,
			teamAbbrevs: r.teamAbbrevs,
			faceoffWinPct: r.faceoffWinPct,
			totalFaceoffs: r.totalFaceoffs,
			offensiveZoneFaceoffPct: r.offensiveZoneFaceoffPct,
			offensiveZoneFaceoffs: r.offensiveZoneFaceoffs,
			defensiveZoneFaceoffPct: r.defensiveZoneFaceoffPct,
			defensiveZoneFaceoffs: r.defensiveZoneFaceoffs,
			neutralZoneFaceoffPct: r.neutralZoneFaceoffPct,
			neutralZoneFaceoffs: r.neutralZoneFaceoffs,
			evFaceoffPct: r.evFaceoffPct,
			evFaceoffs: r.evFaceoffs,
			ppFaceoffPct: r.ppFaceoffPct,
			ppFaceoffs: r.ppFaceoffs,
			shFaceoffPct: r.shFaceoffPct,
			shFaceoffs: r.shFaceoffs,
			updatedAt: new Date(),
		}),
	},
	{
		report: "powerplay",
		transform: transformSkaterPowerplay,
		conflictSet: (r: typeof nhlSkaterAdvancedStats.$inferInsert) => ({
			gamesPlayed: r.gamesPlayed,
			positionCode: r.positionCode,
			teamAbbrevs: r.teamAbbrevs,
			ppGoals: r.ppGoals,
			ppAssists: r.ppAssists,
			ppPoints: r.ppPoints,
			ppGoalsPer60: r.ppGoalsPer60,
			ppPointsPer60: r.ppPointsPer60,
			ppPrimaryAssists: r.ppPrimaryAssists,
			ppPrimaryAssistsPer60: r.ppPrimaryAssistsPer60,
			ppSecondaryAssists: r.ppSecondaryAssists,
			ppSecondaryAssistsPer60: r.ppSecondaryAssistsPer60,
			ppShots: r.ppShots,
			ppShotsPer60: r.ppShotsPer60,
			ppShootingPct: r.ppShootingPct,
			ppIndividualSatFor: r.ppIndividualSatFor,
			ppIndividualSatForPer60: r.ppIndividualSatForPer60,
			ppToi: r.ppToi,
			ppToiPctPerGame: r.ppToiPctPerGame,
			updatedAt: new Date(),
		}),
	},
	{
		report: "penaltykill",
		transform: transformSkaterPenaltykill,
		conflictSet: (r: typeof nhlSkaterAdvancedStats.$inferInsert) => ({
			gamesPlayed: r.gamesPlayed,
			positionCode: r.positionCode,
			teamAbbrevs: r.teamAbbrevs,
			shGoals: r.shGoals,
			shAssists: r.shAssists,
			shPoints: r.shPoints,
			shGoalsPer60: r.shGoalsPer60,
			shPointsPer60: r.shPointsPer60,
			shPrimaryAssists: r.shPrimaryAssists,
			shPrimaryAssistsPer60: r.shPrimaryAssistsPer60,
			shSecondaryAssists: r.shSecondaryAssists,
			shSecondaryAssistsPer60: r.shSecondaryAssistsPer60,
			shShots: r.shShots,
			shShotsPer60: r.shShotsPer60,
			shShootingPct: r.shShootingPct,
			shIndividualSatFor: r.shIndividualSatFor,
			shIndividualSatForPer60: r.shIndividualSatForPer60,
			shToi: r.shToi,
			shToiPctPerGame: r.shToiPctPerGame,
			ppGoalsAgainstPer60: r.ppGoalsAgainstPer60,
			updatedAt: new Date(),
		}),
	},
] as const;

const GOALIE_REPORTS = [
	{
		report: "advanced",
		transform: transformGoalieAdvanced,
		conflictSet: (r: typeof nhlGoalieAdvancedStats.$inferInsert) => ({
			gamesPlayed: r.gamesPlayed,
			teamAbbrevs: r.teamAbbrevs,
			qualityStart: r.qualityStart,
			qualityStartsPct: r.qualityStartsPct,
			completeGames: r.completeGames,
			completeGamePct: r.completeGamePct,
			incompleteGames: r.incompleteGames,
			goalsFor: r.goalsFor,
			goalsForAverage: r.goalsForAverage,
			goalsAgainst: r.goalsAgainst,
			goalsAgainstAverage: r.goalsAgainstAverage,
			regulationWins: r.regulationWins,
			regulationLosses: r.regulationLosses,
			shotsAgainstPer60: r.shotsAgainstPer60,
			savePct: r.savePct,
			timeOnIce: r.timeOnIce,
			updatedAt: new Date(),
		}),
	},
	{
		report: "savesByStrength",
		transform: transformGoalieSavesByStrength,
		conflictSet: (r: typeof nhlGoalieAdvancedStats.$inferInsert) => ({
			gamesPlayed: r.gamesPlayed,
			teamAbbrevs: r.teamAbbrevs,
			evSaves: r.evSaves,
			evShotsAgainst: r.evShotsAgainst,
			evSavePct: r.evSavePct,
			evGoalsAgainst: r.evGoalsAgainst,
			ppSaves: r.ppSaves,
			ppShotsAgainst: r.ppShotsAgainst,
			ppSavePct: r.ppSavePct,
			ppGoalsAgainst: r.ppGoalsAgainst,
			shSaves: r.shSaves,
			shShotsAgainst: r.shShotsAgainst,
			shSavePct: r.shSavePct,
			shGoalsAgainst: r.shGoalsAgainst,
			totalSaves: r.totalSaves,
			totalShotsAgainst: r.totalShotsAgainst,
			totalSavePct: r.totalSavePct,
			totalGoalsAgainst: r.totalGoalsAgainst,
			wins: r.wins,
			losses: r.losses,
			otLosses: r.otLosses,
			updatedAt: new Date(),
		}),
	},
] as const;

export const advancedStatsTask: SyncTask = {
	name: "advanced-stats",
	getInterval: intervals.advancedStats,

	async run(ctx: SyncContext): Promise<number> {
		const startedAt = new Date();
		const seasonId = currentSeasonId();
		let upserted = 0;
		let errors = 0;

		for (const gameTypeId of [2, 3]) {
			// Skater reports
			for (const config of SKATER_REPORTS) {
				try {
					const rows = await fetchAllPages(
						(start) =>
							endpoints.statsReport.skater(config.report, {
								seasonId,
								gameTypeId,
								start,
								limit: PAGE_SIZE,
							}),
					);

					for (const row of rows) {
						const transformed = config.transform(row as never, gameTypeId);
						await ctx.db
							.insert(nhlSkaterAdvancedStats)
							.values(transformed)
							.onConflictDoUpdate({
								target: nhlSkaterAdvancedStats.id,
								set: config.conflictSet(transformed),
							});
						upserted++;
					}
				} catch (err) {
					errors++;
					console.error(
						`[sync] advanced-stats: failed skater/${config.report} (gameType=${gameTypeId})`,
						err instanceof Error ? err.message : err,
					);
				}
			}

			// Goalie reports
			for (const config of GOALIE_REPORTS) {
				try {
					const rows = await fetchAllPages(
						(start) =>
							endpoints.statsReport.goalie(config.report, {
								seasonId,
								gameTypeId,
								start,
								limit: PAGE_SIZE,
							}),
					);

					for (const row of rows) {
						const transformed = config.transform(row as never, gameTypeId);
						await ctx.db
							.insert(nhlGoalieAdvancedStats)
							.values(transformed)
							.onConflictDoUpdate({
								target: nhlGoalieAdvancedStats.id,
								set: config.conflictSet(transformed),
							});
						upserted++;
					}
				} catch (err) {
					errors++;
					console.error(
						`[sync] advanced-stats: failed goalie/${config.report} (gameType=${gameTypeId})`,
						err instanceof Error ? err.message : err,
					);
				}
			}
		}

		await ctx.db.insert(nhlSyncLog).values({
			taskName: "advanced-stats",
			status: errors > 0 ? "error" : "success",
			durationMs: Date.now() - startedAt.getTime(),
			recordsUpserted: upserted,
			error: errors > 0 ? `${errors} report fetches failed` : null,
			startedAt,
		});

		return upserted;
	},
};
