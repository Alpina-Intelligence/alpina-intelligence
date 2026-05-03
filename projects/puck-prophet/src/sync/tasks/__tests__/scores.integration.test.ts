import { beforeEach, describe, expect, it, vi } from 'vitest'
import scoreFixture from '@/__fixtures__/nhl/score-now.json'
import { nhlGameGoals, nhlGames, nhlPlayers, nhlSyncLog } from '@/db/nhl-schema'
import type { NhlScoreResponse } from '@/lib/nhl-api/types'
import { createMockCtx } from './helpers/mock-ctx'

vi.mock('@/lib/nhl-api', () => ({
  nhlFetch: vi.fn(),
  endpoints: {
    scores: { now: vi.fn().mockReturnValue('https://mock/score/now') },
  },
}))

import { nhlFetch } from '@/lib/nhl-api'

const mockNhlFetch = vi.mocked(nhlFetch)

const fixtureData = scoreFixture as unknown as NhlScoreResponse

describe('scores task integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches from the scores endpoint', async () => {
    const { scoresTask } = await import('../scores')
    mockNhlFetch.mockResolvedValue({
      data: { ...fixtureData, games: [] },
      raw: '{}',
    })
    const { ctx } = createMockCtx()

    await scoresTask.run(ctx)

    expect(mockNhlFetch).toHaveBeenCalledWith('https://mock/score/now')
  })

  it("sets game state to 'live' when LIVE/CRIT games exist", async () => {
    const { scoresTask } = await import('../scores')
    const liveGames = fixtureData.games.filter(
      (g) => g.gameState === 'LIVE' || g.gameState === 'CRIT',
    )
    // Fixture has LIVE games; if not, fabricate one
    const games =
      liveGames.length > 0
        ? fixtureData.games
        : [{ ...fixtureData.games[0], gameState: 'LIVE' as const }]

    mockNhlFetch.mockResolvedValue({
      data: { ...fixtureData, games },
      raw: '{}',
    })
    const { ctx, setGameState } = createMockCtx()

    await scoresTask.run(ctx)

    expect(setGameState).toHaveBeenCalledWith('live')
  })

  it("sets game state to 'gameday' when games exist but none LIVE/CRIT", async () => {
    const { scoresTask } = await import('../scores')
    // Use only OFF/FUT games
    const nonLiveGames = fixtureData.games
      .filter((g) => g.gameState !== 'LIVE' && g.gameState !== 'CRIT')
      .slice(0, 2)
    const games =
      nonLiveGames.length > 0
        ? nonLiveGames
        : [{ ...fixtureData.games[0], gameState: 'OFF' as const }]

    mockNhlFetch.mockResolvedValue({
      data: { ...fixtureData, games },
      raw: '{}',
    })
    const { ctx, setGameState } = createMockCtx()

    await scoresTask.run(ctx)

    expect(setGameState).toHaveBeenCalledWith('gameday')
  })

  it("sets game state to 'quiet' when no games", async () => {
    const { scoresTask } = await import('../scores')
    mockNhlFetch.mockResolvedValue({
      data: { ...fixtureData, games: [] },
      raw: '{}',
    })
    const { ctx, setGameState } = createMockCtx()

    await scoresTask.run(ctx)

    expect(setGameState).toHaveBeenCalledWith('quiet')
  })

  it('upserts each game into nhlGames', async () => {
    const { scoresTask } = await import('../scores')
    // Strip goals to simplify counting
    const games = fixtureData.games.slice(0, 3).map((g) => ({
      ...g,
      goals: [],
    }))
    mockNhlFetch.mockResolvedValue({
      data: { ...fixtureData, games },
      raw: '{}',
    })
    const { ctx, insertsFor } = createMockCtx()

    await scoresTask.run(ctx)

    const gameInserts = insertsFor(nhlGames)
    expect(gameInserts).toHaveLength(3)
    expect(gameInserts[0].values).toHaveProperty('id', games[0].id)
    expect(gameInserts[0].onConflict).not.toBeNull()
    expect(gameInserts[0].onConflict!.set).toHaveProperty('gameState')
    expect(gameInserts[0].onConflict!.set).toHaveProperty('homeScore')
  })

  it('upserts goals for games that have them', async () => {
    const { scoresTask } = await import('../scores')
    const gameWithGoals = fixtureData.games.find(
      (g) => g.goals && g.goals.length > 0,
    )
    if (!gameWithGoals) return

    mockNhlFetch.mockResolvedValue({
      data: { ...fixtureData, games: [gameWithGoals] },
      raw: '{}',
    })
    const { ctx, insertsFor } = createMockCtx()

    await scoresTask.run(ctx)

    const goalInserts = insertsFor(nhlGameGoals)
    expect(goalInserts).toHaveLength(gameWithGoals.goals!.length)
    expect(goalInserts[0].values).toHaveProperty('gameId', gameWithGoals.id)
  })

  it("archives raw response with 'scores' bucket", async () => {
    const { scoresTask } = await import('../scores')
    const rawJson = JSON.stringify(fixtureData)
    mockNhlFetch.mockResolvedValue({
      data: { ...fixtureData, games: [] },
      raw: rawJson,
    })
    const { ctx, archiveRaw } = createMockCtx()

    await scoresTask.run(ctx)

    expect(archiveRaw).toHaveBeenCalledWith(
      'scores',
      expect.stringContaining('.json'),
      rawJson,
    )
  })

  it('returns total upserted count (games + goals)', async () => {
    const { scoresTask } = await import('../scores')
    const gameWithGoals = fixtureData.games.find(
      (g) => g.goals && g.goals.length > 0,
    )
    if (!gameWithGoals) return

    mockNhlFetch.mockResolvedValue({
      data: { ...fixtureData, games: [gameWithGoals] },
      raw: '{}',
    })
    const { ctx } = createMockCtx()

    const result = await scoresTask.run(ctx)

    expect(result).toBe(1 + (gameWithGoals.goals?.length ?? 0))
  })

  it('writes sync log with success status', async () => {
    const { scoresTask } = await import('../scores')
    mockNhlFetch.mockResolvedValue({
      data: { ...fixtureData, games: [] },
      raw: '{}',
    })
    const { ctx, insertsFor } = createMockCtx()

    await scoresTask.run(ctx)

    const logInserts = insertsFor(nhlSyncLog)
    expect(logInserts).toHaveLength(1)
    expect(logInserts[0].values).toMatchObject({
      taskName: 'scores',
      status: 'success',
    })
  })

  it('skips goals from players not in the DB', async () => {
    const { scoresTask } = await import('../scores')
    const gameWithGoals = fixtureData.games.find(
      (g) => g.goals && g.goals.length > 0,
    )
    if (!gameWithGoals) return

    mockNhlFetch.mockResolvedValue({
      data: { ...fixtureData, games: [gameWithGoals] },
      raw: '{}',
    })

    // Provide an empty player list — no player IDs are "known"
    const { ctx, insertsFor } = createMockCtx({
      selectData: new Map([[nhlPlayers, []]]),
    })

    await scoresTask.run(ctx)

    // Game should still be upserted, but no goals
    const gameInserts = insertsFor(nhlGames)
    expect(gameInserts).toHaveLength(1)

    const goalInserts = insertsFor(nhlGameGoals)
    expect(goalInserts).toHaveLength(0)
  })
})
