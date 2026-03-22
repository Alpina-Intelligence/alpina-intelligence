import { beforeEach, describe, expect, it, vi } from 'vitest'
import mcdavidFixture from '@/__fixtures__/nhl/player-mcdavid.json'
import skinnerFixture from '@/__fixtures__/nhl/player-skinner.json'
import {
  nhlGoalieSeasonStats,
  nhlPlayers,
  nhlSkaterSeasonStats,
  nhlSyncLog,
} from '@/db/nhl-schema'
import { nhlSeasonTotals } from '@/lib/nhl-api/transformers'
import type { NhlPlayerLandingResponse } from '@/lib/nhl-api/types'
import { createMockCtx } from './helpers/mock-ctx'

vi.mock('@/lib/nhl-api', () => ({
  nhlFetch: vi.fn(),
  endpoints: {
    player: {
      landing: vi
        .fn()
        .mockImplementation(
          (id: number) => `https://mock/player/${id}/landing`,
        ),
    },
  },
}))

import { nhlFetch } from '@/lib/nhl-api'

const mockNhlFetch = vi.mocked(nhlFetch)

const mcdavid = mcdavidFixture as unknown as NhlPlayerLandingResponse
const skinner = skinnerFixture as unknown as NhlPlayerLandingResponse

describe('player-stats task integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 0 and writes 'skipped' log when no active players", async () => {
    const { playerStatsTask } = await import('../player-stats')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { ctx, insertsFor } = createMockCtx({
      selectData: new Map([[nhlPlayers, []]]),
    })

    const result = await playerStatsTask.run(ctx)

    expect(result).toBe(0)
    const logInserts = insertsFor(nhlSyncLog)
    expect(logInserts).toHaveLength(1)
    expect(logInserts[0].values).toMatchObject({
      taskName: 'player-stats',
      status: 'skipped',
      recordsUpserted: 0,
    })
    warnSpy.mockRestore()
  })

  it('routes skater stats to nhlSkaterSeasonStats', async () => {
    const { playerStatsTask } = await import('../player-stats')
    mockNhlFetch.mockResolvedValue({
      data: mcdavid,
      raw: JSON.stringify(mcdavid),
    })

    const { ctx, insertsFor } = createMockCtx({
      selectData: new Map([
        [nhlPlayers, [{ id: mcdavid.playerId, position: 'C' }]],
      ]),
    })

    await playerStatsTask.run(ctx)

    const skaterInserts = insertsFor(nhlSkaterSeasonStats)
    const goalieInserts = insertsFor(nhlGoalieSeasonStats)
    const expectedStats = nhlSeasonTotals(mcdavid.seasonTotals)

    expect(skaterInserts).toHaveLength(expectedStats.length)
    expect(goalieInserts).toHaveLength(0)
    expect(skaterInserts[0].values).toHaveProperty('playerId', mcdavid.playerId)
  })

  it('routes goalie stats to nhlGoalieSeasonStats', async () => {
    const { playerStatsTask } = await import('../player-stats')
    mockNhlFetch.mockResolvedValue({
      data: skinner,
      raw: JSON.stringify(skinner),
    })

    const { ctx, insertsFor } = createMockCtx({
      selectData: new Map([
        [nhlPlayers, [{ id: skinner.playerId, position: 'G' }]],
      ]),
    })

    await playerStatsTask.run(ctx)

    const goalieInserts = insertsFor(nhlGoalieSeasonStats)
    const skaterInserts = insertsFor(nhlSkaterSeasonStats)
    const expectedStats = nhlSeasonTotals(skinner.seasonTotals)

    expect(goalieInserts).toHaveLength(expectedStats.length)
    expect(skaterInserts).toHaveLength(0)
    expect(goalieInserts[0].values).toHaveProperty('playerId', skinner.playerId)
  })

  it('handles mixed skater + goalie in same run', async () => {
    const { playerStatsTask } = await import('../player-stats')
    mockNhlFetch.mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes(`/${mcdavid.playerId}/`)) {
        return { data: mcdavid, raw: '{}' }
      }
      return { data: skinner, raw: '{}' }
    })

    const { ctx, insertsFor } = createMockCtx({
      selectData: new Map([
        [
          nhlPlayers,
          [
            { id: mcdavid.playerId, position: 'C' },
            { id: skinner.playerId, position: 'G' },
          ],
        ],
      ]),
    })

    await playerStatsTask.run(ctx)

    expect(insertsFor(nhlSkaterSeasonStats).length).toBeGreaterThan(0)
    expect(insertsFor(nhlGoalieSeasonStats).length).toBeGreaterThan(0)
  })

  it('suppresses error logs after 5 failures', async () => {
    const { playerStatsTask } = await import('../player-stats')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockNhlFetch.mockRejectedValue(new Error('API down'))

    const players = Array.from({ length: 8 }, (_, i) => ({
      id: 1000 + i,
      position: 'C',
    }))
    const { ctx } = createMockCtx({
      selectData: new Map([[nhlPlayers, players]]),
    })

    await playerStatsTask.run(ctx)

    // 5 individual errors + 1 suppression message = 6
    expect(errorSpy).toHaveBeenCalledTimes(6)
    errorSpy.mockRestore()
  })

  it("writes sync log with 'error' status on partial failure", async () => {
    const { playerStatsTask } = await import('../player-stats')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    mockNhlFetch.mockRejectedValue(new Error('fail'))

    const { ctx, insertsFor } = createMockCtx({
      selectData: new Map([[nhlPlayers, [{ id: 1, position: 'C' }]]]),
    })

    await playerStatsTask.run(ctx)

    const logInserts = insertsFor(nhlSyncLog)
    expect(logInserts[0].values).toMatchObject({
      taskName: 'player-stats',
      status: 'error',
    })
    expect(logInserts[0].values).toHaveProperty('error', '1/1 players failed')
    vi.restoreAllMocks()
  })

  it('archives raw response per player', async () => {
    const { playerStatsTask } = await import('../player-stats')
    mockNhlFetch.mockResolvedValue({
      data: mcdavid,
      raw: JSON.stringify(mcdavid),
    })

    const { ctx, archiveRaw } = createMockCtx({
      selectData: new Map([
        [nhlPlayers, [{ id: mcdavid.playerId, position: 'C' }]],
      ]),
    })

    await playerStatsTask.run(ctx)

    expect(archiveRaw).toHaveBeenCalledWith(
      `players/${mcdavid.playerId}`,
      expect.stringContaining('.json'),
      expect.any(String),
    )
  })
})
