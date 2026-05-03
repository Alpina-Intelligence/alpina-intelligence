import { desc, lte } from 'drizzle-orm'
import {
  nhlGameGoals,
  nhlGames,
  nhlPlayers,
  nhlSeasons,
  nhlSyncLog,
} from '@/db/nhl-schema'
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

    // Pre-load known player IDs to avoid FK violations when inserting goals
    const playerRows = await ctx.db
      .select({ id: nhlPlayers.id })
      .from(nhlPlayers)
    const knownPlayerIds = new Set(playerRows.map((p) => p.id))

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
      // Check if we're past the current season's end date
      const today = data.currentDate
      const [latestSeason] = await ctx.db
        .select({ standingsEnd: nhlSeasons.standingsEnd })
        .from(nhlSeasons)
        .where(lte(nhlSeasons.standingsStart, today))
        .orderBy(desc(nhlSeasons.id))
        .limit(1)

      if (latestSeason && today > latestSeason.standingsEnd) {
        newState = 'offseason'
      } else {
        // Fallback to gap heuristic if no season data in DB
        const nextDate = new Date(data.nextDate)
        const todayDate = new Date(data.currentDate)
        const daysUntilNext =
          (nextDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
        newState = daysUntilNext >= 7 ? 'offseason' : 'quiet'
      }
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

      // Upsert goals for this game (skip unknown players to avoid FK violation)
      if (game.goals) {
        for (const goal of game.goals) {
          if (!knownPlayerIds.has(goal.playerId)) {
            console.warn(
              `[sync] scores: skipping goal by unknown player ${goal.playerId} (${goal.firstName.default} ${goal.lastName.default}) in game ${game.id}`,
            )
            continue
          }
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
