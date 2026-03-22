import { and, eq, ne } from 'drizzle-orm'
import { nhlStandings, nhlSyncLog, nhlTeams } from '@/db/nhl-schema'
import { endpoints, nhlFetch } from '@/lib/nhl-api'
import {
  transformStanding,
  transformTeamFromStanding,
} from '@/lib/nhl-api/transformers'
import type { NhlStandingsResponse } from '@/lib/nhl-api/types'
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
    const url = endpoints.standings.now()
    const { data, raw } = await nhlFetch<NhlStandingsResponse>(url)

    await ctx.archiveRaw('standings', `${new Date().toISOString()}.json`, raw)

    let upserted = 0
    const today = new Date().toISOString().slice(0, 10)

    // Mark previous current standings as not current (new snapshot today)
    await ctx.db
      .update(nhlStandings)
      .set({ isCurrent: false })
      .where(
        and(
          eq(nhlStandings.isCurrent, true),
          ne(nhlStandings.snapshotDate, today),
        ),
      )

    // We need team IDs to link standings. The standings response doesn't
    // include team IDs directly, but the score response does. We build
    // a lookup from existing teams in the DB, and for any missing teams
    // we'll create a placeholder that the roster sync will fill in.
    const existingTeams = await ctx.db.select().from(nhlTeams)
    const teamByAbbrev = new Map(existingTeams.map((t) => [t.abbrev, t]))

    for (const standing of data.standings) {
      const abbrev = standing.teamAbbrev.default

      // Upsert team reference data
      const teamRow = transformTeamFromStanding(standing)
      const existing = teamByAbbrev.get(abbrev)

      if (existing) {
        // Update metadata but keep the real team ID
        await ctx.db
          .insert(nhlTeams)
          .values({ ...teamRow, id: existing.id })
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
