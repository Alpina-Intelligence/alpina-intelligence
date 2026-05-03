import { and, eq, ne } from 'drizzle-orm'
import {
  nhlGoalieSeasonStats,
  nhlPlayers,
  nhlSkaterSeasonStats,
  nhlSyncLog,
} from '@/db/nhl-schema'
import { endpoints, nhlFetch } from '@/lib/nhl-api'
import {
  nhlSeasonTotals,
  transformGoalieSeasonStats,
  transformSkaterSeasonStats,
} from '@/lib/nhl-api/transformers'
import type { NhlPlayerLandingResponse } from '@/lib/nhl-api/types'
import { batchProcess } from '../batch'
import type { SyncContext, SyncTask } from '../scheduler'
import { intervals } from '../scheduler'

/**
 * Player stats task — fetches player landing pages and upserts season stats.
 * Only syncs active players currently in the DB (populated by roster sync).
 */
export const playerStatsTask: SyncTask = {
  name: 'player-stats',
  getInterval: intervals.playerStats,

  async run(ctx: SyncContext): Promise<number> {
    const startedAt = new Date()

    // Get all active players from DB
    const activePlayers = await ctx.db
      .select({ id: nhlPlayers.id, position: nhlPlayers.position })
      .from(nhlPlayers)
      .where(eq(nhlPlayers.isActive, true))

    if (activePlayers.length === 0) {
      console.warn('[sync] player-stats: no active players in DB, skipping')
      await ctx.db.insert(nhlSyncLog).values({
        taskName: 'player-stats',
        status: 'skipped',
        durationMs: Date.now() - startedAt.getTime(),
        recordsUpserted: 0,
        startedAt,
      })
      return 0
    }

    let upserted = 0
    let errors = 0
    const today = new Date().toISOString().slice(0, 10)

    // Mark previous current stats as not current (new snapshot today)
    await ctx.db
      .update(nhlSkaterSeasonStats)
      .set({ isCurrent: false })
      .where(
        and(
          eq(nhlSkaterSeasonStats.isCurrent, true),
          ne(nhlSkaterSeasonStats.snapshotDate, today),
        ),
      )
    await ctx.db
      .update(nhlGoalieSeasonStats)
      .set({ isCurrent: false })
      .where(
        and(
          eq(nhlGoalieSeasonStats.isCurrent, true),
          ne(nhlGoalieSeasonStats.snapshotDate, today),
        ),
      )

    async function processPlayer(player: {
      id: number
      position: string
    }): Promise<number> {
      const url = endpoints.player.landing(player.id)
      const { data, raw } = await nhlFetch<NhlPlayerLandingResponse>(url)

      await ctx.archiveRaw(
        `players/${player.id}`,
        `${new Date().toISOString()}.json`,
        raw,
      )

      const nhlStats = nhlSeasonTotals(data.seasonTotals)
      const isGoalie = player.position === 'G'
      let count = 0

      for (const st of nhlStats) {
        if (isGoalie) {
          const row = transformGoalieSeasonStats(player.id, st, today)
          await ctx.db
            .insert(nhlGoalieSeasonStats)
            .values(row)
            .onConflictDoUpdate({
              target: nhlGoalieSeasonStats.id,
              set: {
                gamesPlayed: row.gamesPlayed,
                gamesStarted: row.gamesStarted,
                wins: row.wins,
                losses: row.losses,
                otLosses: row.otLosses,
                goalsAgainst: row.goalsAgainst,
                goalsAgainstAvg: row.goalsAgainstAvg,
                shotsAgainst: row.shotsAgainst,
                savePctg: row.savePctg,
                shutouts: row.shutouts,
                goals: row.goals,
                assists: row.assists,
                pim: row.pim,
                timeOnIce: row.timeOnIce,
                updatedAt: new Date(),
              },
            })
        } else {
          const row = transformSkaterSeasonStats(player.id, st, today)
          await ctx.db
            .insert(nhlSkaterSeasonStats)
            .values(row)
            .onConflictDoUpdate({
              target: nhlSkaterSeasonStats.id,
              set: {
                gamesPlayed: row.gamesPlayed,
                goals: row.goals,
                assists: row.assists,
                points: row.points,
                plusMinus: row.plusMinus,
                pim: row.pim,
                powerPlayGoals: row.powerPlayGoals,
                powerPlayPoints: row.powerPlayPoints,
                shorthandedGoals: row.shorthandedGoals,
                shorthandedPoints: row.shorthandedPoints,
                gameWinningGoals: row.gameWinningGoals,
                otGoals: row.otGoals,
                shots: row.shots,
                shootingPctg: row.shootingPctg,
                avgToi: row.avgToi,
                faceoffWinPctg: row.faceoffWinPctg,
                updatedAt: new Date(),
              },
            })
        }
        count++
      }

      return count
    }

    const results = await batchProcess(
      activePlayers,
      processPlayer,
      ctx.taskConfig?.batchSize ?? 10,
      (player, err) => {
        errors++
        if (errors <= 5) {
          console.error(
            `[sync] player-stats: failed for player ${player.id}`,
            err instanceof Error ? err.message : err,
          )
        } else if (errors === 6) {
          console.error(
            `[sync] player-stats: suppressing further error logs (${activePlayers.length - 5} remaining)`,
          )
        }
      },
    )

    upserted = results.reduce((sum, n) => sum + n, 0)

    await ctx.db.insert(nhlSyncLog).values({
      taskName: 'player-stats',
      status: errors > 0 ? 'error' : 'success',
      durationMs: Date.now() - startedAt.getTime(),
      recordsUpserted: upserted,
      error:
        errors > 0 ? `${errors}/${activePlayers.length} players failed` : null,
      startedAt,
    })

    return upserted
  },
}
