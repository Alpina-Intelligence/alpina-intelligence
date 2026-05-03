import { vi } from 'vitest'
import {
  nhlGameGoals,
  nhlGames,
  nhlGoalieSeasonStats,
  nhlPlayers,
  nhlSeasons,
  nhlSkaterSeasonStats,
  nhlStandings,
  nhlSyncLog,
  nhlTeams,
} from '@/db/nhl-schema'
import type { GameState, SyncContext } from '@/sync/scheduler'

// ---------------------------------------------------------------------------
// Types for tracking DB operations
// ---------------------------------------------------------------------------

export interface InsertRecord {
  table: unknown
  values: unknown
  onConflict: {
    target: unknown
    set: Record<string, unknown>
  } | null
}

export interface MockCtxOptions {
  gameState?: GameState
  /** Map of table reference → rows returned by select().from(table) */
  selectData?: Map<unknown, unknown[]>
}

export interface MockCtxResult {
  ctx: SyncContext
  /** Returns all inserts targeting a specific table */
  insertsFor: (table: unknown) => InsertRecord[]
  /** All recorded insert operations */
  allInserts: InsertRecord[]
  /** Spy for setGameState */
  setGameState: ReturnType<typeof vi.fn>
  /** Spy for archiveRaw */
  archiveRaw: ReturnType<typeof vi.fn>
}

// ---------------------------------------------------------------------------
// Table name lookup (for debugging, not used in assertions)
// ---------------------------------------------------------------------------

const TABLE_NAMES = new Map<unknown, string>([
  [nhlTeams, 'teams'],
  [nhlPlayers, 'players'],
  [nhlGames, 'games'],
  [nhlGameGoals, 'goals'],
  [nhlStandings, 'standings'],
  [nhlSeasons, 'seasons'],
  [nhlSkaterSeasonStats, 'skaterStats'],
  [nhlGoalieSeasonStats, 'goalieStats'],
  [nhlSyncLog, 'syncLog'],
])

export function tableName(table: unknown): string {
  return TABLE_NAMES.get(table) ?? 'unknown'
}

// ---------------------------------------------------------------------------
// createMockCtx
// ---------------------------------------------------------------------------

export function createMockCtx(opts: MockCtxOptions = {}): MockCtxResult {
  const { gameState: initialGameState = 'quiet', selectData = new Map() } = opts

  const inserts: InsertRecord[] = []

  // ---- Mock insert chain ----
  // db.insert(table).values(row).onConflictDoUpdate({target, set})
  const mockInsert = vi.fn((table: unknown) => ({
    values: vi.fn((data: unknown) => {
      const record: InsertRecord = { table, values: data, onConflict: null }
      inserts.push(record)
      return {
        onConflictDoUpdate: vi.fn(
          (config: { target: unknown; set: Record<string, unknown> }) => {
            record.onConflict = config
            return Promise.resolve()
          },
        ),
      }
    }),
  }))

  // ---- Mock select chain ----
  // Supports: db.select().from(table), .where(), .orderBy(), .limit()
  function createQueryChain(rows: unknown[]) {
    const promise = Promise.resolve(rows)
    const chain = Object.assign(promise, {
      where: vi.fn((): typeof chain => chain),
      orderBy: vi.fn((): typeof chain => chain),
      limit: vi.fn((n: number) => createQueryChain(rows.slice(0, n))),
    })
    return chain
  }

  const mockSelect = vi.fn((_columns?: unknown) => ({
    from: vi.fn((table: unknown) => {
      const rows = selectData.get(table) ?? []
      return createQueryChain(rows)
    }),
  }))

  // ---- Mock update chain ----
  // db.update(table).set(data).where(condition)
  const mockUpdate = vi.fn((_table: unknown) => ({
    set: vi.fn((_data: unknown) => ({
      where: vi.fn().mockResolvedValue(undefined),
    })),
  }))

  const mockDb = { insert: mockInsert, select: mockSelect, update: mockUpdate }

  let currentGameState = initialGameState
  const setGameStateSpy = vi.fn((state: GameState) => {
    currentGameState = state
  })
  const archiveRawSpy = vi.fn().mockResolvedValue(undefined)

  const ctx: SyncContext = {
    db: mockDb as unknown as SyncContext['db'],
    get gameState() {
      return currentGameState
    },
    setGameState: setGameStateSpy,
    archiveRaw: archiveRawSpy,
  }

  const insertsFor = (table: unknown) =>
    inserts.filter((i) => i.table === table)

  return {
    ctx,
    insertsFor,
    allInserts: inserts,
    setGameState: setGameStateSpy,
    archiveRaw: archiveRawSpy,
  }
}
