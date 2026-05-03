import type { db as DbInstance } from '@/db'
import { nhlSyncTaskConfig } from '@/db/nhl-schema'
import type { GameState } from './scheduler'

export interface TaskConfig {
  taskName: string
  enabled: boolean
  intervals: Record<GameState, number>
  batchSize: number | null
}

let configCache: Map<string, TaskConfig> = new Map()
let lastFetchedAt = 0

const CACHE_TTL_MS = 30_000

export async function loadConfig(
  db: typeof DbInstance,
): Promise<Map<string, TaskConfig>> {
  const rows = await db.select().from(nhlSyncTaskConfig)
  const map = new Map<string, TaskConfig>()
  for (const row of rows) {
    map.set(row.taskName, {
      taskName: row.taskName,
      enabled: row.enabled,
      intervals: {
        live: row.intervalLiveMs,
        gameday: row.intervalGamedayMs,
        quiet: row.intervalQuietMs,
        offseason: row.intervalOffseasonMs,
      },
      batchSize: row.batchSize,
    })
  }
  configCache = map
  lastFetchedAt = Date.now()
  return map
}

export async function getTaskConfig(
  db: typeof DbInstance,
  taskName: string,
): Promise<TaskConfig | undefined> {
  if (Date.now() - lastFetchedAt > CACHE_TTL_MS) {
    await loadConfig(db)
  }
  return configCache.get(taskName)
}
