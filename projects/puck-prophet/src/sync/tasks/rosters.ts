import { nhlTeams, nhlPlayers, nhlSyncLog } from "@/db/nhl-schema";
import { nhlFetch, endpoints } from "@/lib/nhl-api";
import { transformPlayer } from "@/lib/nhl-api/transformers";
import type { NhlRosterResponse } from "@/lib/nhl-api/types";
import type { SyncTask, SyncContext } from "../scheduler";
import { intervals } from "../scheduler";
import { batchProcess } from "../batch";

// All 32 NHL team abbreviations (stable — only changes with expansion/relocation)
const NHL_TEAMS = [
	"ANA", "BOS", "BUF", "CGY", "CAR", "CHI", "COL", "CBJ",
	"DAL", "DET", "EDM", "FLA", "LAK", "MIN", "MTL", "NSH",
	"NJD", "NYI", "NYR", "OTT", "PHI", "PIT", "SJS", "SEA",
	"STL", "TBL", "TOR", "UTA", "VAN", "VGK", "WPG", "WSH",
] as const;

/**
 * Rosters task — fetches every team's roster and upserts players + teams.
 * This is the authoritative source for team IDs and player bios.
 */
export const rostersTask: SyncTask = {
	name: "rosters",
	getInterval: intervals.rosters,

	async run(ctx: SyncContext): Promise<number> {
		const startedAt = new Date();
		let upserted = 0;

		// Fetch team lookup once before batching
		const allTeams = await ctx.db.select().from(nhlTeams);

		async function processTeam(abbrev: string): Promise<number> {
			const url = endpoints.roster.current(abbrev);
			const { data, raw } =
				await nhlFetch<NhlRosterResponse>(url);

			await ctx.archiveRaw(
				`rosters/${abbrev}`,
				`${new Date().toISOString()}.json`,
				raw,
			);

			const allPlayers = [
				...data.forwards,
				...data.defensemen,
				...data.goalies,
			];

			if (allPlayers.length === 0) return 0;

			const team = allTeams.find((t) => t.abbrev === abbrev);

			if (!team) {
				console.warn(
					`[sync] rosters: team ${abbrev} not in DB yet, skipping`,
				);
				return 0;
			}

			for (const p of allPlayers) {
				const row = transformPlayer(p, team.id, abbrev);
				await ctx.db
					.insert(nhlPlayers)
					.values(row)
					.onConflictDoUpdate({
						target: nhlPlayers.id,
						set: {
							firstName: row.firstName,
							lastName: row.lastName,
							teamId: row.teamId,
							teamAbbrev: row.teamAbbrev,
							position: row.position,
							sweaterNumber: row.sweaterNumber,
							shootsCatches: row.shootsCatches,
							heightInches: row.heightInches,
							weightPounds: row.weightPounds,
							headshotUrl: row.headshotUrl,
							isActive: true,
							updatedAt: new Date(),
						},
					});
			}

			return allPlayers.length;
		}

		const results = await batchProcess(
			NHL_TEAMS,
			processTeam,
			8,
			(abbrev, err) => {
				console.error(
					`[sync] rosters: failed for ${abbrev}`,
					err instanceof Error ? err.message : err,
				);
			},
		);

		upserted = results.reduce((sum, n) => sum + n, 0);

		await ctx.db.insert(nhlSyncLog).values({
			taskName: "rosters",
			status: "success",
			durationMs: Date.now() - startedAt.getTime(),
			recordsUpserted: upserted,
			startedAt,
		});

		return upserted;
	},
};
