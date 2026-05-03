import { and, eq, ne } from 'drizzle-orm'
import { nhlSeasons, nhlStandings, nhlSyncLog, nhlTeams } from '@/db/nhl-schema'
import { endpoints, nhlFetch } from '@/lib/nhl-api'
import {
  transformSeason,
  transformStanding,
  transformTeamFromStanding,
} from '@/lib/nhl-api/transformers'
import type {
  NhlStandingsResponse,
  NhlStandingsSeasonResponse,
} from '@/lib/nhl-api/types'
import type { SyncContext, SyncTask } from '../scheduler'
import { intervals } from '../scheduler'

/**
 * Standings task — also bootstraps team reference data.
 * The standings endpoint is the richest source of team metadata
 * (conference, division, logo), so we upsert teams here too.
 */
export const standingsTask: SyncTask = {
  name: 'standings',
  getInterval: intervals.standings,

  async run(ctx: SyncContext): Promise<number> {
    const startedAt = new Date()

    // Sync seasons (lightweight, ~2KB response)
    const { data: seasonData } = await nhlFetch<NhlStandingsSeasonResponse>(
      endpoints.season.standingsSeason(),
    )
    for (const entry of seasonData.seasons) {
      const row = transformSeason(entry)
      await ctx.db
        .insert(nhlSeasons)
        .values(row)
        .onConflictDoUpdate({
          target: nhlSeasons.id,
          set: {
            standingsStart: row.standingsStart,
            standingsEnd: row.standingsEnd,
          },
        })
    }

    const url = endpoints.standings.now()
    const { data, raw } = await nhlFetch<NhlStandingsResponse>(url)

    await ctx.archiveRaw('standings', `${new Date().toISOString()}.json`, raw)

    let upserted = 0
    const today = new Date().toISOString().slice(0, 10)

    // Only clear isCurrent for the active season's older snapshots.
    // When a season is complete (today > standingsEnd), its final
    // standings should keep isCurrent=true.
    const apiSeasonId = data.standings[0]?.seasonId
    if (apiSeasonId) {
      const seasonMeta = seasonData.seasons.find((s) => s.id === apiSeasonId)
      const seasonStillActive = seasonMeta && today <= seasonMeta.standingsEnd

      if (seasonStillActive) {
        await ctx.db
          .update(nhlStandings)
          .set({ isCurrent: false })
          .where(
            and(
              eq(nhlStandings.seasonId, apiSeasonId),
              eq(nhlStandings.isCurrent, true),
              ne(nhlStandings.snapshotDate, today),
            ),
          )
      }
    }

    // The standings response doesn't include team IDs, so we look up
    // existing teams by abbrev. Teams are seeded by bootstrap on first
    // startup; any missing teams are skipped here.
    const existingTeams = await ctx.db.select().from(nhlTeams)
    const teamByAbbrev = new Map(existingTeams.map((t) => [t.abbrev, t]))

    for (const standing of data.standings) {
      const abbrev = standing.teamAbbrev.default

      // Upsert team reference data
      const existing = teamByAbbrev.get(abbrev)

      if (existing) {
        const teamRow = transformTeamFromStanding(standing, existing.id)
        await ctx.db
          .insert(nhlTeams)
          .values(teamRow)
          .onConflictDoUpdate({
            target: nhlTeams.id,
            set: {
              name: teamRow.name,
              fullName: teamRow.fullName,
              conference: teamRow.conference,
              conferenceAbbrev: teamRow.conferenceAbbrev,
              division: teamRow.division,
              divisionAbbrev: teamRow.divisionAbbrev,
              logoUrl: teamRow.logoUrl,
            },
          })
      }

      // Upsert standing (skip if team doesn't exist yet — roster sync will create it)
      const teamId = existing?.id
      if (teamId) {
        const standingRow = transformStanding(standing, teamId, today)
        await ctx.db
          .insert(nhlStandings)
          .values(standingRow)
          .onConflictDoUpdate({
            target: nhlStandings.id,
            set: {
              conference: standingRow.conference,
              conferenceAbbrev: standingRow.conferenceAbbrev,
              division: standingRow.division,
              divisionAbbrev: standingRow.divisionAbbrev,
              gamesPlayed: standingRow.gamesPlayed,
              wins: standingRow.wins,
              losses: standingRow.losses,
              otLosses: standingRow.otLosses,
              points: standingRow.points,
              pointPctg: standingRow.pointPctg,
              goalFor: standingRow.goalFor,
              goalAgainst: standingRow.goalAgainst,
              goalDifferential: standingRow.goalDifferential,
              regulationWins: standingRow.regulationWins,
              regulationPlusOtWins: standingRow.regulationPlusOtWins,
              homeWins: standingRow.homeWins,
              homeLosses: standingRow.homeLosses,
              homeOtLosses: standingRow.homeOtLosses,
              homePoints: standingRow.homePoints,
              roadWins: standingRow.roadWins,
              roadLosses: standingRow.roadLosses,
              roadOtLosses: standingRow.roadOtLosses,
              roadPoints: standingRow.roadPoints,
              l10Wins: standingRow.l10Wins,
              l10Losses: standingRow.l10Losses,
              l10OtLosses: standingRow.l10OtLosses,
              l10Points: standingRow.l10Points,
              streakCode: standingRow.streakCode,
              streakCount: standingRow.streakCount,
              leagueSequence: standingRow.leagueSequence,
              conferenceSequence: standingRow.conferenceSequence,
              divisionSequence: standingRow.divisionSequence,
              wildcardSequence: standingRow.wildcardSequence,
              updatedAt: new Date(),
            },
          })
        upserted++
      }
    }

    await ctx.db.insert(nhlSyncLog).values({
      taskName: 'standings',
      status: 'success',
      durationMs: Date.now() - startedAt.getTime(),
      recordsUpserted: upserted,
      startedAt,
    })

    return upserted
  },
}
