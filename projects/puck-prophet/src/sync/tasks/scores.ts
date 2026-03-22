import { nhlGameGoals, nhlGames, nhlSyncLog } from '@/db/nhl-schema'
import { endpoints, nhlFetch } from '@/lib/nhl-api'
import { transformGame, transformGoal } from '@/lib/nhl-api/transformers'
import type { NhlScoreResponse } from '@/lib/nhl-api/types'
import type { GameState, SyncContext, SyncTask } from '../scheduler'
import { intervals } from '../scheduler'

/**
 * Scores task — the "heartbeat" of the sync engine.
 * Fetches current scores, upserts games and goals,
 * and updates the global game state that drives all other task intervals.
 */
export const scoresTask: SyncTask = {
  name: 'scores',
  getInterval: intervals.scores,

  async run(ctx: SyncContext): Promise<number> {
    const startedAt = new Date()
    const url = endpoints.scores.now()
    const { data, raw } = await nhlFetch<NhlScoreResponse>(url)

    // Archive raw response
    await ctx.archiveRaw('scores', `${new Date().toISOString()}.json`, raw)

    // Detect game state from response
    const liveGames = data.games.filter(
      (g) => g.gameState === 'LIVE' || g.gameState === 'CRIT',
    )
    const todaysGames = data.games.length

    let newState: GameState
    if (liveGames.length > 0) {
      newState = 'live'
    } else if (todaysGames > 0) {
      newState = 'gameday'
    } else {
      const nextDate = new Date(data.nextDate)
      const today = new Date(data.currentDate)
      const daysUntilNext =
        (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      newState = daysUntilNext >= 7 ? 'offseason' : 'quiet'
    }
    ctx.setGameState(newState)

    // Upsert games
    let upserted = 0
    for (const game of data.games) {
      const row = transformGame(game)
      await ctx.db
        .insert(nhlGames)
        .values(row)
        .onConflictDoUpdate({
          target: nhlGames.id,
          set: {
            gameState: row.gameState,
            period: row.period,
            periodType: row.periodType,
            clock: row.clock,
            homeScore: row.homeScore,
            awayScore: row.awayScore,
            homeSog: row.homeSog,
            awaySog: row.awaySog,
            updatedAt: new Date(),
          },
        })
      upserted++

      // Upsert goals for this game
      if (game.goals) {
        for (const goal of game.goals) {
          const goalRow = transformGoal(goal, game.id)
          await ctx.db
            .insert(nhlGameGoals)
            .values(goalRow)
            .onConflictDoUpdate({
              target: nhlGameGoals.id,
              set: {
                goalsToDate: goalRow.goalsToDate,
                homeScore: goalRow.homeScore,
                awayScore: goalRow.awayScore,
                highlightUrl: goalRow.highlightUrl,
              },
            })
          upserted++
        }
      }
    }

    // Log sync execution
    await ctx.db.insert(nhlSyncLog).values({
      taskName: 'scores',
      status: 'success',
      durationMs: Date.now() - startedAt.getTime(),
      recordsUpserted: upserted,
      startedAt,
    })

    return upserted
  },
}
