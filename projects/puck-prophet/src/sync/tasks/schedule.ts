import { nhlGames, nhlSyncLog } from "@/db/nhl-schema";
import { nhlFetch, endpoints } from "@/lib/nhl-api";
import { transformGame } from "@/lib/nhl-api/transformers";
import type { NhlScheduleResponse } from "@/lib/nhl-api/types";
import type { NhlGameScore } from "@/lib/nhl-api/types";
import type { SyncTask, SyncContext } from "../scheduler";
import { intervals } from "../scheduler";

/**
 * Schedule task — fetches the current week's schedule and upserts games.
 * This ensures future games are in the DB before they go live.
 * The scores task handles updating game state and results.
 */
export const scheduleTask: SyncTask = {
	name: "schedule",
	getInterval: intervals.schedule,

	async run(ctx: SyncContext): Promise<number> {
		const startedAt = new Date();
		const url = endpoints.schedule.now();
		const { data, raw } = await nhlFetch<NhlScheduleResponse>(url);

		await ctx.archiveRaw(
			"schedule",
			`${new Date().toISOString()}.json`,
			raw,
		);

		let upserted = 0;

		for (const day of data.gameWeek) {
			for (const game of day.games) {
				// Schedule games have the same shape as score games
				// but may lack scores/SOG for future games
				const row = transformGame(game as NhlGameScore);
				await ctx.db
					.insert(nhlGames)
					.values(row)
					.onConflictDoUpdate({
						target: nhlGames.id,
						set: {
							gameDate: row.gameDate,
							startTimeUtc: row.startTimeUtc,
							venue: row.venue,
							gameState: row.gameState,
							neutralSite: row.neutralSite,
							updatedAt: new Date(),
						},
					});
				upserted++;
			}
		}

		await ctx.db.insert(nhlSyncLog).values({
			taskName: "schedule",
			status: "success",
			durationMs: Date.now() - startedAt.getTime(),
			recordsUpserted: upserted,
			startedAt,
		});

		return upserted;
	},
};
