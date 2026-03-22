import { beforeEach, describe, expect, it, vi } from 'vitest'
import goalieAdvancedFixture from '@/__fixtures__/nhl/goalie-advanced.json'
import skaterRealtimeFixture from '@/__fixtures__/nhl/skater-realtime.json'
import {
  nhlGoalieAdvancedStats,
  nhlSkaterAdvancedStats,
  nhlSyncLog,
} from '@/db/nhl-schema'
import { createMockCtx } from './helpers/mock-ctx'

vi.mock('@/lib/nhl-api', () => ({
  nhlFetch: vi.fn(),
  endpoints: {
    statsReport: {
      skater: vi
        .fn()
        .mockImplementation(
          (
            report: string,
            params: {
              seasonId: number
              gameTypeId: number
              start: number
              limit: number
            },
          ) =>
            `https://mock/skater/${report}?s=${params.seasonId}&gt=${params.gameTypeId}&start=${params.start}`,
        ),
      goalie: vi
        .fn()
        .mockImplementation(
          (
            report: string,
            params: {
              seasonId: number
              gameTypeId: number
              start: number
              limit: number
            },
          ) =>
            `https://mock/goalie/${report}?s=${params.seasonId}&gt=${params.gameTypeId}&start=${params.start}`,
        ),
    },
  },
}))

vi.mock('@/lib/nhl-api/transformers', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/nhl-api/transformers')>()
  return {
    ...actual,
    currentSeasonId: vi.fn().mockReturnValue(20242025),
  }
})

import { nhlFetch } from '@/lib/nhl-api'

const mockNhlFetch = vi.mocked(nhlFetch)

describe('advanced-stats task integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches all 7 skater reports and 2 goalie reports per gameType', async () => {
    const { advancedStatsTask } = await import('../advanced-stats')
    mockNhlFetch.mockResolvedValue({
      data: { data: [], total: 0 },
      raw: '{}',
    })
    const { ctx } = createMockCtx()

    await advancedStatsTask.run(ctx)

    // 2 gameTypes × (7 skater + 2 goalie) = 18 fetches
    expect(mockNhlFetch).toHaveBeenCalledTimes(18)
  })

  it('upserts skater data to nhlSkaterAdvancedStats', async () => {
    const { advancedStatsTask } = await import('../advanced-stats')
    mockNhlFetch.mockImplementation(async (url) => {
      if (
        typeof url === 'string' &&
        url.includes('/skater/realtime') &&
        url.includes('gt=2') &&
        url.includes('start=0')
      ) {
        return { data: skaterRealtimeFixture, raw: '{}' }
      }
      return { data: { data: [], total: 0 }, raw: '{}' }
    })
    const { ctx, insertsFor } = createMockCtx()

    await advancedStatsTask.run(ctx)

    const skaterInserts = insertsFor(nhlSkaterAdvancedStats)
    expect(skaterInserts.length).toBe(2)
    expect(skaterInserts[0].values).toHaveProperty('playerId', 8480748)
    expect(skaterInserts[0].values).toHaveProperty('hits', 462)
    expect(skaterInserts[1].values).toHaveProperty('playerId', 8478402)
  })

  it('upserts goalie data to nhlGoalieAdvancedStats', async () => {
    const { advancedStatsTask } = await import('../advanced-stats')
    mockNhlFetch.mockImplementation(async (url) => {
      if (
        typeof url === 'string' &&
        url.includes('/goalie/advanced') &&
        url.includes('gt=2') &&
        url.includes('start=0')
      ) {
        return { data: goalieAdvancedFixture, raw: '{}' }
      }
      return { data: { data: [], total: 0 }, raw: '{}' }
    })
    const { ctx, insertsFor } = createMockCtx()

    await advancedStatsTask.run(ctx)

    const goalieInserts = insertsFor(nhlGoalieAdvancedStats)
    expect(goalieInserts.length).toBe(1)
    expect(goalieInserts[0].values).toHaveProperty('playerId', 8480038)
    expect(goalieInserts[0].values).toHaveProperty('qualityStart', 15)
  })

  it('uses onConflictDoUpdate with report-specific columns', async () => {
    const { advancedStatsTask } = await import('../advanced-stats')
    mockNhlFetch.mockImplementation(async (url) => {
      if (
        typeof url === 'string' &&
        url.includes('/skater/realtime') &&
        url.includes('gt=2') &&
        url.includes('start=0')
      ) {
        return { data: skaterRealtimeFixture, raw: '{}' }
      }
      return { data: { data: [], total: 0 }, raw: '{}' }
    })
    const { ctx, insertsFor } = createMockCtx()

    await advancedStatsTask.run(ctx)

    const inserts = insertsFor(nhlSkaterAdvancedStats)
    const conflictSet = inserts[0].onConflict!.set
    // Realtime report columns should be present
    expect(conflictSet).toHaveProperty('hits')
    expect(conflictSet).toHaveProperty('takeaways')
    expect(conflictSet).toHaveProperty('updatedAt')
    // Percentages columns should NOT be present
    expect(conflictSet).not.toHaveProperty('satPercentage')
    expect(conflictSet).not.toHaveProperty('usatPercentage')
  })

  it('handles empty response gracefully', async () => {
    const { advancedStatsTask } = await import('../advanced-stats')
    mockNhlFetch.mockResolvedValue({
      data: { data: [], total: 0 },
      raw: '{}',
    })
    const { ctx, insertsFor } = createMockCtx()

    const result = await advancedStatsTask.run(ctx)

    expect(result).toBe(0)
    const logInserts = insertsFor(nhlSyncLog)
    expect(logInserts).toHaveLength(1)
    expect(logInserts[0].values).toMatchObject({
      taskName: 'advanced-stats',
      status: 'success',
      recordsUpserted: 0,
    })
  })

  it('returns total upsert count across all reports', async () => {
    const { advancedStatsTask } = await import('../advanced-stats')
    mockNhlFetch.mockImplementation(async (url) => {
      if (
        typeof url === 'string' &&
        url.includes('/skater/realtime') &&
        url.includes('gt=2') &&
        url.includes('start=0')
      ) {
        return { data: skaterRealtimeFixture, raw: '{}' }
      }
      return { data: { data: [], total: 0 }, raw: '{}' }
    })
    const { ctx } = createMockCtx()

    const result = await advancedStatsTask.run(ctx)

    // 2 skaters from realtime report (gameType 2 only, gameType 3 returns empty)
    expect(result).toBe(2)
  })

  it('writes error status when a report fetch fails', async () => {
    const { advancedStatsTask } = await import('../advanced-stats')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    let calls = 0
    mockNhlFetch.mockImplementation(async () => {
      calls++
      if (calls === 1) throw new Error('API down')
      return { data: { data: [], total: 0 }, raw: '{}' }
    })
    const { ctx, insertsFor } = createMockCtx()

    await advancedStatsTask.run(ctx)

    const logInserts = insertsFor(nhlSyncLog)
    expect(logInserts[0].values).toMatchObject({
      taskName: 'advanced-stats',
      status: 'error',
    })
    expect(logInserts[0].values).toHaveProperty('error')
    errorSpy.mockRestore()
  })

  it('paginates when response has PAGE_SIZE rows', async () => {
    const { advancedStatsTask } = await import('../advanced-stats')
    // First page returns 100 items, second returns fewer
    const fullPage = Array.from({ length: 100 }, (_, i) => ({
      ...skaterRealtimeFixture.data[0],
      playerId: 1000 + i,
    }))
    const lastPage = [{ ...skaterRealtimeFixture.data[0], playerId: 9999 }]

    mockNhlFetch.mockImplementation(async (url) => {
      if (
        typeof url === 'string' &&
        url.includes('/skater/realtime') &&
        url.includes('gt=2')
      ) {
        if (url.includes('start=0')) {
          return { data: { data: fullPage, total: 101 }, raw: '{}' }
        }
        return { data: { data: lastPage, total: 101 }, raw: '{}' }
      }
      return { data: { data: [], total: 0 }, raw: '{}' }
    })
    const { ctx, insertsFor } = createMockCtx()

    await advancedStatsTask.run(ctx)

    const skaterInserts = insertsFor(nhlSkaterAdvancedStats)
    expect(skaterInserts.length).toBe(101)
  })
})
