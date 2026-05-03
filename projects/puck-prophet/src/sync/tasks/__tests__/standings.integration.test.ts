import { beforeEach, describe, expect, it, vi } from 'vitest'
import standingsFixture from '@/__fixtures__/nhl/standings-now.json'
import { nhlStandings, nhlSyncLog, nhlTeams } from '@/db/nhl-schema'
import type { NhlStandingsResponse } from '@/lib/nhl-api/types'
import { createMockCtx } from './helpers/mock-ctx'

vi.mock('@/lib/nhl-api', () => ({
  nhlFetch: vi.fn(),
  endpoints: {
    standings: {
      now: vi.fn().mockReturnValue('https://mock/standings/now'),
    },
  },
}))

import { nhlFetch } from '@/lib/nhl-api'

const mockNhlFetch = vi.mocked(nhlFetch)

const fixtureData = standingsFixture as unknown as NhlStandingsResponse

describe('standings task integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches from the standings endpoint', async () => {
    const { standingsTask } = await import('../standings')
    mockNhlFetch.mockResolvedValue({
      data: { ...fixtureData, standings: [] },
      raw: '{}',
    })
    const { ctx } = createMockCtx()

    await standingsTask.run(ctx)

    expect(mockNhlFetch).toHaveBeenCalledWith('https://mock/standings/now')
  })

  it('upserts team metadata for teams found in DB', async () => {
    const { standingsTask } = await import('../standings')
    const standing = fixtureData.standings[0]
    const abbrev = standing.teamAbbrev.default

    mockNhlFetch.mockResolvedValue({
      data: { ...fixtureData, standings: [standing] },
      raw: '{}',
    })
    const { ctx, insertsFor } = createMockCtx({
      selectData: new Map([[nhlTeams, [{ id: 10, abbrev, name: 'Test' }]]]),
    })

    await standingsTask.run(ctx)

    const teamInserts = insertsFor(nhlTeams)
    expect(teamInserts).toHaveLength(1)
    // Uses the existing team's ID
    expect(teamInserts[0].values).toHaveProperty('id', 10)
  })

  it('upserts standing row when team exists in DB', async () => {
    const { standingsTask } = await import('../standings')
    const standing = fixtureData.standings[0]
    const abbrev = standing.teamAbbrev.default

    mockNhlFetch.mockResolvedValue({
      data: { ...fixtureData, standings: [standing] },
      raw: '{}',
    })
    const { ctx, insertsFor } = createMockCtx({
      selectData: new Map([[nhlTeams, [{ id: 10, abbrev }]]]),
    })

    await standingsTask.run(ctx)

    const standingInserts = insertsFor(nhlStandings)
    expect(standingInserts).toHaveLength(1)
    expect(standingInserts[0].values).toHaveProperty('teamId', 10)
    expect(standingInserts[0].onConflict).not.toBeNull()
  })

  it('skips standing and team upsert when team NOT in DB', async () => {
    const { standingsTask } = await import('../standings')
    const standing = fixtureData.standings[0]

    mockNhlFetch.mockResolvedValue({
      data: { ...fixtureData, standings: [standing] },
      raw: '{}',
    })
    // Empty teams in DB
    const { ctx, insertsFor } = createMockCtx({
      selectData: new Map([[nhlTeams, []]]),
    })

    await standingsTask.run(ctx)

    expect(insertsFor(nhlStandings)).toHaveLength(0)
    expect(insertsFor(nhlTeams)).toHaveLength(0)
  })

  it('returns count of upserted standings', async () => {
    const { standingsTask } = await import('../standings')
    const twoStandings = fixtureData.standings.slice(0, 2)

    mockNhlFetch.mockResolvedValue({
      data: { ...fixtureData, standings: twoStandings },
      raw: '{}',
    })
    const { ctx } = createMockCtx({
      selectData: new Map([
        [
          nhlTeams,
          twoStandings.map((s, i) => ({
            id: i + 1,
            abbrev: s.teamAbbrev.default,
          })),
        ],
      ]),
    })

    const result = await standingsTask.run(ctx)

    expect(result).toBe(2)
  })

  it('writes sync log on completion', async () => {
    const { standingsTask } = await import('../standings')
    mockNhlFetch.mockResolvedValue({
      data: { ...fixtureData, standings: [] },
      raw: '{}',
    })
    const { ctx, insertsFor } = createMockCtx()

    await standingsTask.run(ctx)

    const logInserts = insertsFor(nhlSyncLog)
    expect(logInserts).toHaveLength(1)
    expect(logInserts[0].values).toMatchObject({
      taskName: 'standings',
      status: 'success',
      recordsUpserted: 0,
    })
  })
})
