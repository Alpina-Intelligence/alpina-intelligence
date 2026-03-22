import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { nhlEngineState, nhlRawResponseCache } from '@/db/nhl-schema'
import { loadConfig } from './config'
import { createScheduler, type GameState, type SyncContext } from './scheduler'
import { advancedStatsTask } from './tasks/advanced-stats'
import { gameLogsTask } from './tasks/game-logs'
import { playerStatsTask } from './tasks/player-stats'
import { rostersTask } from './tasks/rosters'
import { scheduleTask } from './tasks/schedule'
import { scoresTask } from './tasks/scores'
import { standingsTask } from './tasks/standings'

// ---------------------------------------------------------------------------
// Game state — shared mutable state for the sync engine
// ---------------------------------------------------------------------------
let currentGameState: GameState = 'quiet'

// ---------------------------------------------------------------------------
// Blob storage archive (stub — wire up S3 client for Hetzner Object Storage)
// ---------------------------------------------------------------------------
async function archiveRaw(
  bucket: string,
  key: string,
  body: string,
): Promise<void> {
  // TODO: Wire up S3-compatible client for Hetzner Object Storage
  // For now, just update the Postgres cache (last response per endpoint)
  await db
    .insert(nhlRawResponseCache)
    .values({
      endpoint: bucket,
      params: key,
      responseBody: JSON.parse(body),
      fetchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: nhlRawResponseCache.endpoint,
      set: {
        params: key,
        responseBody: JSON.parse(body),
        fetchedAt: new Date(),
      },
    })
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ctx: SyncContext = {
  db,
  get gameState() {
    return currentGameState
  },
  setGameState(state: GameState) {
    if (state !== currentGameState) {
      console.log(`[sync] Game state changed: ${currentGameState} → ${state}`)
      currentGameState = state
      // Persist to DB for monitoring dashboard
      db.update(nhlEngineState)
        .set({ gameState: state })
        .where(eq(nhlEngineState.id, 1))
        .catch((err) =>
          console.error('[sync] Failed to update engine state:', err),
        )
    }
  },
  archiveRaw,
}

// ---------------------------------------------------------------------------
// Task ordering: scores first (heartbeat), then standings (teams),
// then rosters (players), then schedule and player stats.
// The staggered initial delay in the scheduler spaces these out.
// ---------------------------------------------------------------------------
const tasks = [
  scoresTask,
  standingsTask,
  rostersTask,
  scheduleTask,
  playerStatsTask,
  advancedStatsTask,
  gameLogsTask,
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

// Load config from DB (falls back gracefully if table is empty/missing)
const initialConfig = await loadConfig(db).catch(() => new Map())
console.log(`[sync] Loaded config for ${initialConfig.size} tasks`)

// Write engine state row (upsert)
await db
  .insert(nhlEngineState)
  .values({ id: 1, gameState: currentGameState, startedAt: new Date() })
  .onConflictDoUpdate({
    target: nhlEngineState.id,
    set: { gameState: currentGameState, startedAt: new Date() },
  })
  .catch((err) => console.error('[sync] Failed to write engine state:', err))

const scheduler = createScheduler(tasks, ctx, { maxConcurrency: 3 })

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[sync] Received SIGINT, shutting down...')
  scheduler.stop()
})

process.on('SIGTERM', () => {
  console.log('[sync] Received SIGTERM, shutting down...')
  scheduler.stop()
})

console.log('[sync] NHL data sync engine starting...')
console.log(
  `[sync] Database: ${process.env.DATABASE_URL ? 'connected' : '⚠ DATABASE_URL not set'}`,
)
await scheduler.start()
