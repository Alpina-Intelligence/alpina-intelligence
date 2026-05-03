import { and, eq, ne } from 'drizzle-orm'
import {
  nhlGoalieAdvancedStats,
  nhlSeasons,
  nhlSkaterAdvancedStats,
  nhlSyncLog,
} from '@/db/nhl-schema'
import { endpoints } from '@/lib/nhl-api'
import { findActiveSeasonId } from '@/lib/nhl-api/transformers'
import {
  fetchAllPages,
  GOALIE_REPORTS,
  PAGE_SIZE,
  SKATER_REPORTS,
} from '../advanced-stats-config'
import type { SyncContext, SyncTask } from '../scheduler'
import { intervals } from '../scheduler'

export const advancedStatsTask: SyncTask = {
  name: 'advanced-stats',
  getInterval: intervals.advancedStats,

  async run(ctx: SyncContext): Promise<number> {
    const startedAt = new Date()
    const seasons = await ctx.db.select().from(nhlSeasons)
    const seasonId = findActiveSeasonId(seasons)
    const today = new Date().toISOString().slice(0, 10)
    let upserted = 0
    let errors = 0

    // Mark previous current advanced stats as not current
    await ctx.db
      .update(nhlSkaterAdvancedStats)
      .set({ isCurrent: false })
      .where(
        and(
          eq(nhlSkaterAdvancedStats.isCurrent, true),
          ne(nhlSkaterAdvancedStats.snapshotDate, today),
        ),
      )
    await ctx.db
      .update(nhlGoalieAdvancedStats)
      .set({ isCurrent: false })
      .where(
        and(
          eq(nhlGoalieAdvancedStats.isCurrent, true),
          ne(nhlGoalieAdvancedStats.snapshotDate, today),
        ),
      )

    for (const gameTypeId of [2, 3]) {
      // Skater reports
      for (const config of SKATER_REPORTS) {
        try {
          const rows = await fetchAllPages((start) =>
            endpoints.statsReport.skater(config.report, {
              seasonId,
              gameTypeId,
              start,
              limit: PAGE_SIZE,
            }),
          )

          for (const row of rows) {
            const transformed = config.transform(
              row as never,
              gameTypeId,
              today,
            )
            await ctx.db
              .insert(nhlSkaterAdvancedStats)
              .values(transformed)
              .onConflictDoUpdate({
                target: nhlSkaterAdvancedStats.id,
                set: config.conflictSet(transformed),
              })
            upserted++
          }
        } catch (err) {
          errors++
          console.error(
            `[sync] advanced-stats: failed skater/${config.report} (gameType=${gameTypeId})`,
            err instanceof Error ? err.message : err,
          )
        }
      }

      // Goalie reports
      for (const config of GOALIE_REPORTS) {
        try {
          const rows = await fetchAllPages((start) =>
            endpoints.statsReport.goalie(config.report, {
              seasonId,
              gameTypeId,
              start,
              limit: PAGE_SIZE,
            }),
          )

          for (const row of rows) {
            const transformed = config.transform(
              row as never,
              gameTypeId,
              today,
            )
            await ctx.db
              .insert(nhlGoalieAdvancedStats)
              .values(transformed)
              .onConflictDoUpdate({
                target: nhlGoalieAdvancedStats.id,
                set: config.conflictSet(transformed),
              })
            upserted++
          }
        } catch (err) {
          errors++
          console.error(
            `[sync] advanced-stats: failed goalie/${config.report} (gameType=${gameTypeId})`,
            err instanceof Error ? err.message : err,
          )
        }
      }
    }

    await ctx.db.insert(nhlSyncLog).values({
      taskName: 'advanced-stats',
      status: errors > 0 ? 'error' : 'success',
      durationMs: Date.now() - startedAt.getTime(),
      recordsUpserted: upserted,
      error: errors > 0 ? `${errors} report fetches failed` : null,
      startedAt,
    })

    return upserted
  },
}
