import { eq } from 'drizzle-orm'
import {
  nhlGoalieGameLogs,
  nhlPlayers,
  nhlSkaterGameLogs,
  nhlSyncLog,
} from '@/db/nhl-schema'
import { endpoints, NhlApiError, nhlFetch } from '@/lib/nhl-api'
import {
  currentSeasonId,
  transformGoalieGameLog,
  transformSkaterGameLog,
} from '@/lib/nhl-api/transformers'
import type { NhlPlayerGameLogResponse } from '@/lib/nhl-api/types'
import { batchProcess } from '../batch'
import type { SyncContext, SyncTask } from '../scheduler'
import { intervals } from '../scheduler'

/**
 * Game logs task — fetches per-game box score stats for all active players.
 * Upserts into skater/goalie game log tables.
 */
export const gameLogsTask: SyncTask = {
  name: 'game-logs',
  getInterval: intervals.gameLogs,

  async run(ctx: SyncContext): Promise<number> {
    const startedAt = new Date()
    const seasonId = currentSeasonId()

    const activePlayers = await ctx.db
      .select({ id: nhlPlayers.id, position: nhlPlayers.position })
      .from(nhlPlayers)
      .where(eq(nhlPlayers.isActive, true))

    if (activePlayers.length === 0) {
      console.warn('[sync] game-logs: no active players in DB, skipping')
      await ctx.db.insert(nhlSyncLog).values({
        taskName: 'game-logs',
        status: 'skipped',
        durationMs: Date.now() - startedAt.getTime(),
        recordsUpserted: 0,
        startedAt,
      })
      return 0
    }

    let upserted = 0
    let errors = 0

    async function processPlayer(player: {
      id: number
      position: string
    }): Promise<number> {
      let count = 0
      const isGoalie = player.position === 'G'

      // Fetch regular season and playoffs
      for (const gameType of [2, 3]) {
        try {
          const url = endpoints.player.gameLog(player.id, seasonId, gameType)
          const { data } = await nhlFetch<NhlPlayerGameLogResponse>(url)

          for (const entry of data.gameLog ?? []) {
            if (isGoalie) {
              const row = transformGoalieGameLog(
                player.id,
                entry as Parameters<typeof transformGoalieGameLog>[1],
                seasonId,
                gameType,
              )
              await ctx.db
                .insert(nhlGoalieGameLogs)
                .values(row)
                .onConflictDoUpdate({
                  target: nhlGoalieGameLogs.id,
                  set: {
                    gamesStarted: row.gamesStarted,
                    decision: row.decision,
                    shotsAgainst: row.shotsAgainst,
                    goalsAgainst: row.goalsAgainst,
                    savePctg: row.savePctg,
                    shutouts: row.shutouts,
                    goals: row.goals,
                    assists: row.assists,
                    pim: row.pim,
                    toi: row.toi,
                  },
                })
            } else {
              const row = transformSkaterGameLog(
                player.id,
                entry as Parameters<typeof transformSkaterGameLog>[1],
                seasonId,
                gameType,
              )
              await ctx.db
                .insert(nhlSkaterGameLogs)
                .values(row)
                .onConflictDoUpdate({
                  target: nhlSkaterGameLogs.id,
                  set: {
                    goals: row.goals,
                    assists: row.assists,
                    points: row.points,
                    plusMinus: row.plusMinus,
                    powerPlayGoals: row.powerPlayGoals,
                    powerPlayPoints: row.powerPlayPoints,
                    shorthandedGoals: row.shorthandedGoals,
                    shorthandedPoints: row.shorthandedPoints,
                    gameWinningGoals: row.gameWinningGoals,
                    otGoals: row.otGoals,
                    shots: row.shots,
                    shifts: row.shifts,
                    pim: row.pim,
                    toi: row.toi,
                  },
                })
            }
            count++
          }
        } catch (err) {
          // 404 = player has no games this season/gameType
          if (err instanceof NhlApiError && err.status === 404) continue
          throw err
        }
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
            `[sync] game-logs: failed for player ${player.id}`,
            err instanceof Error ? err.message : err,
          )
        } else if (errors === 6) {
          console.error(
            `[sync] game-logs: suppressing further error logs (${activePlayers.length - 5} remaining)`,
          )
        }
      },
    )

    upserted = results.reduce((sum, n) => sum + n, 0)

    await ctx.db.insert(nhlSyncLog).values({
      taskName: 'game-logs',
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
