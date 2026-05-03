import { parseArgs } from 'node:util'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import {
  nhlGameGoals,
  nhlGames,
  nhlGoalieAdvancedStats,
  nhlGoalieGameLogs,
  nhlGoalieSeasonStats,
  nhlPlayers,
  nhlSkaterAdvancedStats,
  nhlSkaterGameLogs,
  nhlSkaterSeasonStats,
  nhlStandings,
  nhlTeams,
} from '@/db/nhl-schema'
import { endpoints, NhlApiError, nhlFetch } from '@/lib/nhl-api'
import {
  currentSeasonId,
  nhlSeasonTotals,
  transformGame,
  transformGoal,
  transformGoalieGameLog,
  transformGoalieSeasonStats,
  transformPlayer,
  transformSkaterGameLog,
  transformSkaterSeasonStats,
  transformStanding,
  transformTeamFromStanding,
} from '@/lib/nhl-api/transformers'
import type {
  NhlPlayerGameLogResponse,
  NhlPlayerLandingResponse,
  NhlRosterResponse,
  NhlScoreResponse,
  NhlStandingsResponse,
  NhlStandingsSeasonResponse,
  NhlStatsRestResponse,
  NhlTeamListEntry,
} from '@/lib/nhl-api/types'
import {
  fetchAllPages,
  GOALIE_REPORTS,
  PAGE_SIZE,
  SKATER_REPORTS,
} from './advanced-stats-config'
import { batchProcess } from './batch'
import {
  bootstrapSeasons,
  bootstrapTeams,
  extractCommonName,
} from './bootstrap'
import { NHL_TEAMS } from './tasks/rosters'

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const { values: args } = parseArgs({
  options: {
    from: { type: 'string', default: '20052006' },
    to: { type: 'string', default: String(currentSeasonId()) },
    phase: { type: 'string' },
    delay: { type: 'string', default: '150' },
    'batch-size': { type: 'string', default: '3' },
    snapshots: { type: 'boolean', default: false },
  },
  strict: true,
})

const DELAY_MS = Number(args.delay)
const BATCH_SIZE = Number(args['batch-size'])
const FROM_SEASON = Number(args.from)
const TO_SEASON = Number(args.to)
const PHASE_FILTER = args.phase as string | undefined
const SNAPSHOTS = args.snapshots ?? false

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function delayedFetch<T>(url: string): Promise<{ data: T; raw: string }> {
  const result = await nhlFetch<T>(url)
  await sleep(DELAY_MS)
  return result
}

function seasonLabel(id: number): string {
  const start = Math.floor(id / 10000)
  return `${start}-${String(start + 1).slice(2)}`
}

function elapsed(startMs: number): string {
  const s = ((Date.now() - startMs) / 1000).toFixed(1)
  return `${s}s`
}

// ---------------------------------------------------------------------------
// Phase 1: Teams (from NHL stats API)
// ---------------------------------------------------------------------------
async function backfillTeams(_seasons: number[]): Promise<number> {
  console.log('\n[backfill] Phase 1: Teams + Seasons')
  const start = Date.now()

  const total = await bootstrapTeams(db)
  const seasonCount = await bootstrapSeasons(db)

  console.log(
    `[backfill] Phase 1 done: ${total} teams, ${seasonCount} seasons in ${elapsed(start)}`,
  )
  return total + seasonCount
}

// ---------------------------------------------------------------------------
// Phase 2: Standings
// ---------------------------------------------------------------------------

/** Upsert standings for a single date. Returns count of upserted rows. */
async function upsertStandingsForDate(
  data: NhlStandingsResponse,
  snapshotDate: string,
  teamByAbbrev: Map<string, { id: number }>,
  isCurrent: boolean,
): Promise<number> {
  let count = 0
  for (const standing of data.standings) {
    const abbrev = standing.teamAbbrev.default
    const team = teamByAbbrev.get(abbrev)
    if (!team) continue

    const standingRow = transformStanding(standing, team.id, snapshotDate)
    // Override isCurrent — historical snapshots are not current
    const values = { ...standingRow, isCurrent }
    await db
      .insert(nhlStandings)
      .values(values)
      .onConflictDoUpdate({
        target: nhlStandings.id,
        set: {
          conference: standingRow.conference,
          conferenceAbbrev: standingRow.conferenceAbbrev,
          division: standingRow.division,
          divisionAbbrev: standingRow.divisionAbbrev,
          gamesPlayed: standingRow.gamesPlayed,
          wins: standingRow.wins,
          losses: standingRow.losses,
          otLosses: standingRow.otLosses,
          points: standingRow.points,
          pointPctg: standingRow.pointPctg,
          goalFor: standingRow.goalFor,
          goalAgainst: standingRow.goalAgainst,
          goalDifferential: standingRow.goalDifferential,
          regulationWins: standingRow.regulationWins,
          regulationPlusOtWins: standingRow.regulationPlusOtWins,
          homeWins: standingRow.homeWins,
          homeLosses: standingRow.homeLosses,
          homeOtLosses: standingRow.homeOtLosses,
          homePoints: standingRow.homePoints,
          roadWins: standingRow.roadWins,
          roadLosses: standingRow.roadLosses,
          roadOtLosses: standingRow.roadOtLosses,
          roadPoints: standingRow.roadPoints,
          l10Wins: standingRow.l10Wins,
          l10Losses: standingRow.l10Losses,
          l10OtLosses: standingRow.l10OtLosses,
          l10Points: standingRow.l10Points,
          streakCode: standingRow.streakCode,
          streakCount: standingRow.streakCount,
          leagueSequence: standingRow.leagueSequence,
          conferenceSequence: standingRow.conferenceSequence,
          divisionSequence: standingRow.divisionSequence,
          wildcardSequence: standingRow.wildcardSequence,
          isCurrent,
          updatedAt: new Date(),
        },
      })
    count++
  }
  return count
}

/** Enrich team metadata from standings (conference, division, fullName). */
async function enrichTeamsFromStandings(
  data: NhlStandingsResponse,
  teamByAbbrev: Map<string, { id: number }>,
): Promise<void> {
  for (const standing of data.standings) {
    const team = teamByAbbrev.get(standing.teamAbbrev.default)
    if (!team) continue
    const teamRow = transformTeamFromStanding(standing, team.id)
    await db
      .insert(nhlTeams)
      .values(teamRow)
      .onConflictDoUpdate({
        target: nhlTeams.id,
        set: {
          name: teamRow.name,
          fullName: teamRow.fullName,
          conference: teamRow.conference,
          conferenceAbbrev: teamRow.conferenceAbbrev,
          division: teamRow.division,
          divisionAbbrev: teamRow.divisionAbbrev,
          logoUrl: teamRow.logoUrl,
        },
      })
  }
}

async function backfillStandings(seasons: number[]): Promise<number> {
  const mode = SNAPSHOTS ? 'daily snapshots' : 'end-of-season'
  console.log(
    `\n[backfill] Phase 2: Standings — ${mode} (${seasons.length} seasons)`,
  )
  const start = Date.now()
  let total = 0

  // Fetch season end dates from the standings-season API
  const { data: standingsSeasonData } =
    await nhlFetch<NhlStandingsSeasonResponse>(
      endpoints.season.standingsSeason(),
    )
  const seasonEndDates = new Map(
    standingsSeasonData.seasons.map((s) => [s.id, s.standingsEnd]),
  )

  // Build team lookup once
  const existingTeams = await db.select().from(nhlTeams)
  const teamByAbbrev = new Map(
    existingTeams.map((t) => [t.abbrev, { id: t.id }]),
  )

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i]
    const startYear = Math.floor(season / 10000)
    const endYear = season % 10000
    let seasonCount = 0

    try {
      if (SNAPSHOTS) {
        // --- Daily snapshot mode: walk every game date ---
        let currentDate = `${startYear}-10-01`
        let lastDate = currentDate
        let dateCount = 0

        while (true) {
          // Use scores endpoint for nextDate navigation
          const { data: scoreData } = await delayedFetch<NhlScoreResponse>(
            endpoints.scores.byDate(currentDate),
          )

          // Fetch standings for this date
          const { data: standingsData } =
            await delayedFetch<NhlStandingsResponse>(
              endpoints.standings.byDate(currentDate),
            )

          if (standingsData.standings.length > 0) {
            const n = await upsertStandingsForDate(
              standingsData,
              currentDate,
              teamByAbbrev,
              false, // not current — we'll mark the last date as current after
            )
            seasonCount += n
            lastDate = currentDate
            dateCount++

            if (dateCount % 20 === 0) {
              console.log(
                `[backfill] standings: ${seasonLabel(season)} — ${dateCount} dates, ${seasonCount} rows so far...`,
              )
            }
          }

          // Navigate to next game date
          if (!scoreData.nextDate) break
          const nextDateObj = new Date(scoreData.nextDate)
          if (
            nextDateObj.getFullYear() > endYear ||
            (nextDateObj.getFullYear() === endYear &&
              nextDateObj.getMonth() >= 6)
          ) {
            break
          }
          currentDate = scoreData.nextDate
        }

        // Mark the last date's standings as current
        if (seasonCount > 0) {
          await db
            .update(nhlStandings)
            .set({ isCurrent: true })
            .where(
              and(
                eq(nhlStandings.seasonId, season),
                eq(nhlStandings.snapshotDate, lastDate),
              ),
            )
        }

        // Enrich team metadata from the last date's standings
        const { data: lastStandings } =
          await delayedFetch<NhlStandingsResponse>(
            endpoints.standings.byDate(lastDate),
          )
        if (lastStandings.standings.length > 0) {
          await enrichTeamsFromStandings(lastStandings, teamByAbbrev)
        }

        console.log(
          `[backfill] standings: ${seasonLabel(season)} (${i + 1}/${seasons.length}) — ${dateCount} dates, ${seasonCount} standings`,
        )
      } else {
        // --- Single date mode: use actual season end date ---
        const endDate = seasonEndDates.get(season)
        if (!endDate) {
          console.warn(
            `[backfill] standings: ${seasonLabel(season)} — no standings-season data, skipping`,
          )
          continue
        }

        const { data } = await delayedFetch<NhlStandingsResponse>(
          endpoints.standings.byDate(endDate),
        )
        if (!data || data.standings.length === 0) {
          console.warn(
            `[backfill] standings: ${seasonLabel(season)} — no standings at ${endDate}, skipping`,
          )
          continue
        }

        await enrichTeamsFromStandings(data, teamByAbbrev)
        seasonCount = await upsertStandingsForDate(
          data,
          endDate,
          teamByAbbrev,
          true, // single date = current
        )

        console.log(
          `[backfill] standings: ${seasonLabel(season)} (${i + 1}/${seasons.length}) — ${seasonCount} standings`,
        )
      }

      total += seasonCount
    } catch (err) {
      console.error(
        `[backfill] standings: ${seasonLabel(season)} FAILED`,
        err instanceof Error ? err.message : err,
      )
    }
  }

  console.log(
    `[backfill] Phase 2 done: ${total} standing upserts in ${elapsed(start)}`,
  )
  return total
}

// ---------------------------------------------------------------------------
// Phase 3: Rosters
// ---------------------------------------------------------------------------
async function backfillRosters(seasons: number[]): Promise<number> {
  console.log(
    `\n[backfill] Phase 3: Rosters (${seasons.length} seasons × ${NHL_TEAMS.length} teams)`,
  )
  const start = Date.now()
  let total = 0

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i]
    const allTeams = await db.select().from(nhlTeams)
    const teamByAbbrev = new Map(allTeams.map((t) => [t.abbrev, t]))
    let seasonCount = 0

    async function processTeam(abbrev: string): Promise<number> {
      const url = endpoints.roster.bySeason(abbrev, season)
      const { data } = await delayedFetch<NhlRosterResponse>(url)

      const allPlayers = [...data.forwards, ...data.defensemen, ...data.goalies]
      if (allPlayers.length === 0) return 0

      const team = teamByAbbrev.get(abbrev)
      if (!team) return 0

      for (const p of allPlayers) {
        const row = transformPlayer(p, team.id, abbrev)
        await db
          .insert(nhlPlayers)
          .values(row)
          .onConflictDoUpdate({
            target: nhlPlayers.id,
            set: {
              firstName: row.firstName,
              lastName: row.lastName,
              teamId: row.teamId,
              teamAbbrev: row.teamAbbrev,
              position: row.position,
              sweaterNumber: row.sweaterNumber,
              shootsCatches: row.shootsCatches,
              heightInches: row.heightInches,
              weightPounds: row.weightPounds,
              headshotUrl: row.headshotUrl,
              updatedAt: new Date(),
            },
          })
      }
      return allPlayers.length
    }

    const results = await batchProcess(
      NHL_TEAMS,
      processTeam,
      BATCH_SIZE,
      (abbrev, err) => {
        // 404 = team didn't exist in this season, expected
        if (err instanceof NhlApiError && err.status === 404) return
        console.error(
          `[backfill] rosters: ${abbrev}/${seasonLabel(season)} FAILED`,
          err instanceof Error ? err.message : err,
        )
      },
    )

    seasonCount = results.reduce((sum, n) => sum + n, 0)
    total += seasonCount

    console.log(
      `[backfill] rosters: ${seasonLabel(season)} (${i + 1}/${seasons.length}) — ${seasonCount} players`,
    )
  }

  console.log(
    `[backfill] Phase 3 done: ${total} player upserts in ${elapsed(start)}`,
  )
  return total
}

// ---------------------------------------------------------------------------
// Phase 4: Player Stats (Landing Pages)
// ---------------------------------------------------------------------------
async function backfillPlayerStats(): Promise<number> {
  const allPlayers = await db
    .select({ id: nhlPlayers.id, position: nhlPlayers.position })
    .from(nhlPlayers)

  console.log(
    `\n[backfill] Phase 4: Player Stats (${allPlayers.length} players)`,
  )
  const start = Date.now()
  let total = 0
  let errors = 0
  let processed = 0

  async function processPlayer(player: {
    id: number
    position: string
  }): Promise<number> {
    const url = endpoints.player.landing(player.id)
    const { data } = await delayedFetch<NhlPlayerLandingResponse>(url)

    const nhlStats = nhlSeasonTotals(data.seasonTotals)
    let count = 0

    for (const st of nhlStats) {
      // Use end-of-season as snapshot date for backfill data
      const endYear = st.season % 10000
      const snapshotDate = `${endYear}-04-15`
      const isGoalie = player.position === 'G'
      if (isGoalie) {
        const row = transformGoalieSeasonStats(player.id, st, snapshotDate)
        await db
          .insert(nhlGoalieSeasonStats)
          .values(row)
          .onConflictDoUpdate({
            target: nhlGoalieSeasonStats.id,
            set: {
              gamesPlayed: row.gamesPlayed,
              gamesStarted: row.gamesStarted,
              wins: row.wins,
              losses: row.losses,
              otLosses: row.otLosses,
              goalsAgainst: row.goalsAgainst,
              goalsAgainstAvg: row.goalsAgainstAvg,
              shotsAgainst: row.shotsAgainst,
              savePctg: row.savePctg,
              shutouts: row.shutouts,
              goals: row.goals,
              assists: row.assists,
              pim: row.pim,
              timeOnIce: row.timeOnIce,
              updatedAt: new Date(),
            },
          })
      } else {
        const row = transformSkaterSeasonStats(player.id, st, snapshotDate)
        await db
          .insert(nhlSkaterSeasonStats)
          .values(row)
          .onConflictDoUpdate({
            target: nhlSkaterSeasonStats.id,
            set: {
              gamesPlayed: row.gamesPlayed,
              goals: row.goals,
              assists: row.assists,
              points: row.points,
              plusMinus: row.plusMinus,
              pim: row.pim,
              powerPlayGoals: row.powerPlayGoals,
              powerPlayPoints: row.powerPlayPoints,
              shorthandedGoals: row.shorthandedGoals,
              shorthandedPoints: row.shorthandedPoints,
              gameWinningGoals: row.gameWinningGoals,
              otGoals: row.otGoals,
              shots: row.shots,
              shootingPctg: row.shootingPctg,
              avgToi: row.avgToi,
              faceoffWinPctg: row.faceoffWinPctg,
              updatedAt: new Date(),
            },
          })
      }
      count++
    }

    processed++
    if (processed % 200 === 0) {
      console.log(
        `[backfill] player-stats: ${processed}/${allPlayers.length} players processed...`,
      )
    }

    return count
  }

  const results = await batchProcess(
    allPlayers,
    processPlayer,
    BATCH_SIZE,
    (player, err) => {
      errors++
      if (errors <= 10) {
        console.error(
          `[backfill] player-stats: player ${player.id} FAILED`,
          err instanceof Error ? err.message : err,
        )
      } else if (errors === 11) {
        console.error('[backfill] player-stats: suppressing further error logs')
      }
    },
  )

  total = results.reduce((sum, n) => sum + n, 0)
  console.log(
    `[backfill] Phase 4 done: ${total} stat upserts (${errors} player errors) in ${elapsed(start)}`,
  )
  return total
}

// ---------------------------------------------------------------------------
// Phase 4b: Game Logs (per-game player stats)
// ---------------------------------------------------------------------------
async function backfillGameLogs(seasons: number[]): Promise<number> {
  const allPlayers = await db
    .select({
      id: nhlPlayers.id,
      position: nhlPlayers.position,
    })
    .from(nhlPlayers)

  console.log(
    `\n[backfill] Phase 4b: Game Logs (${allPlayers.length} players × ${seasons.length} seasons)`,
  )
  const start = Date.now()
  let total = 0
  let errors = 0
  let processed = 0

  async function processPlayer(player: {
    id: number
    position: string
  }): Promise<number> {
    let count = 0
    const isGoalie = player.position === 'G'

    for (const season of seasons) {
      for (const gameType of [2, 3]) {
        try {
          const url = endpoints.player.gameLog(player.id, season, gameType)
          const { data } = await delayedFetch<NhlPlayerGameLogResponse>(url)

          for (const entry of data.gameLog ?? []) {
            if (isGoalie) {
              const row = transformGoalieGameLog(
                player.id,
                entry as Parameters<typeof transformGoalieGameLog>[1],
                season,
                gameType,
              )
              await db
                .insert(nhlGoalieGameLogs)
                .values(row)
                .onConflictDoUpdate({
                  target: nhlGoalieGameLogs.id,
                  set: {
                    gamesStarted: row.gamesStarted,
                    decision: row.decision,
                    shotsAgainst: row.shotsAgainst,
                    goalsAgainst: row.goalsAgainst,
                    savePctg: row.savePctg,
                    shutouts: row.shutouts,
                    goals: row.goals,
                    assists: row.assists,
                    pim: row.pim,
                    toi: row.toi,
                  },
                })
            } else {
              const row = transformSkaterGameLog(
                player.id,
                entry as Parameters<typeof transformSkaterGameLog>[1],
                season,
                gameType,
              )
              await db
                .insert(nhlSkaterGameLogs)
                .values(row)
                .onConflictDoUpdate({
                  target: nhlSkaterGameLogs.id,
                  set: {
                    goals: row.goals,
                    assists: row.assists,
                    points: row.points,
                    plusMinus: row.plusMinus,
                    powerPlayGoals: row.powerPlayGoals,
                    powerPlayPoints: row.powerPlayPoints,
                    shorthandedGoals: row.shorthandedGoals,
                    shorthandedPoints: row.shorthandedPoints,
                    gameWinningGoals: row.gameWinningGoals,
                    otGoals: row.otGoals,
                    shots: row.shots,
                    shifts: row.shifts,
                    pim: row.pim,
                    toi: row.toi,
                  },
                })
            }
            count++
          }
        } catch (err) {
          // 404 = player didn't play this season/gameType, expected
          if (err instanceof NhlApiError && err.status === 404) continue
          throw err
        }
      }
    }

    processed++
    if (processed % 100 === 0) {
      console.log(
        `[backfill] game-logs: ${processed}/${allPlayers.length} players processed...`,
      )
    }

    return count
  }

  const results = await batchProcess(
    allPlayers,
    processPlayer,
    BATCH_SIZE,
    (player, err) => {
      errors++
      if (errors <= 10) {
        console.error(
          `[backfill] game-logs: player ${player.id} FAILED`,
          err instanceof Error ? err.message : err,
        )
      } else if (errors === 11) {
        console.error('[backfill] game-logs: suppressing further error logs')
      }
    },
  )

  total = results.reduce((sum, n) => sum + n, 0)
  console.log(
    `[backfill] Phase 4b done: ${total} game log upserts (${errors} player errors) in ${elapsed(start)}`,
  )
  return total
}

// ---------------------------------------------------------------------------
// Phase 5: Scores (Games + Goals)
// ---------------------------------------------------------------------------
async function backfillScores(seasons: number[]): Promise<number> {
  console.log(`\n[backfill] Phase 5: Scores (${seasons.length} seasons)`)
  const start = Date.now()
  let total = 0

  // Pre-load known player IDs for FK check on goals
  const playerRows = await db.select({ id: nhlPlayers.id }).from(nhlPlayers)
  const knownPlayerIds = new Set(playerRows.map((p) => p.id))

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i]
    const startYear = Math.floor(season / 10000)
    const endYear = season % 10000
    let seasonGames = 0
    let seasonGoals = 0
    let skippedGoals = 0

    // Start walking from October 1 of the start year
    let currentDate = `${startYear}-10-01`

    while (true) {
      try {
        const { data } = await delayedFetch<NhlScoreResponse>(
          endpoints.scores.byDate(currentDate),
        )

        for (const game of data.games) {
          const row = transformGame(game)
          await db
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
          seasonGames++

          if (game.goals) {
            for (const goal of game.goals) {
              // Skip goals from players not in our DB (FK constraint)
              if (!knownPlayerIds.has(goal.playerId)) {
                skippedGoals++
                continue
              }
              const goalRow = transformGoal(goal, game.id)
              await db
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
              seasonGoals++
            }
          }
        }

        // Navigate to next date with games
        if (!data.nextDate) break
        const nextDateObj = new Date(data.nextDate)
        // Stop if we've moved past the season (into July+)
        if (
          nextDateObj.getFullYear() > endYear ||
          (nextDateObj.getFullYear() === endYear && nextDateObj.getMonth() >= 6)
        ) {
          break
        }
        currentDate = data.nextDate
      } catch (err) {
        console.error(
          `[backfill] scores: ${currentDate} FAILED`,
          err instanceof Error ? err.message : err,
        )
        // Try to advance to the next day to avoid getting stuck
        const d = new Date(currentDate)
        d.setDate(d.getDate() + 1)
        currentDate = d.toISOString().slice(0, 10)

        // Safety: stop if we've gone past July
        if (
          d.getFullYear() > endYear ||
          (d.getFullYear() === endYear && d.getMonth() >= 6)
        ) {
          break
        }
      }
    }

    total += seasonGames + seasonGoals
    console.log(
      `[backfill] scores: ${seasonLabel(season)} (${i + 1}/${seasons.length}) — ${seasonGames} games, ${seasonGoals} goals` +
        (skippedGoals > 0
          ? ` (${skippedGoals} goals skipped, missing player FK)`
          : ''),
    )
  }

  console.log(
    `[backfill] Phase 5 done: ${total} game+goal upserts in ${elapsed(start)}`,
  )
  return total
}

// ---------------------------------------------------------------------------
// Phase 6: Advanced Stats
// ---------------------------------------------------------------------------

// Report availability cutoffs (earliest season with data)
const SKATER_REPORT_START: Record<string, number> = {
  realtime: 20052006,
  percentages: 20092010,
  scoringRates: 20092010,
  goalsForAgainst: 20052006,
  faceoffpercentages: 20092010,
  powerplay: 20072008,
  penaltykill: 20072008,
}

const GOALIE_REPORT_START: Record<string, number> = {
  advanced: 20072008,
  savesByStrength: 20072008,
}

async function backfillAdvancedStats(seasons: number[]): Promise<number> {
  console.log(
    `\n[backfill] Phase 6: Advanced Stats (${seasons.length} seasons)`,
  )
  const start = Date.now()
  let total = 0
  let errors = 0

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i]
    const endYear = season % 10000
    const snapshotDate = `${endYear}-04-15`
    let seasonCount = 0

    // Pre-populate missing players from the stats API before upserting
    // The stats API includes players who appeared in games but aren't on current rosters
    try {
      const existingPlayerIds = new Set(
        (await db.select({ id: nhlPlayers.id }).from(nhlPlayers)).map(
          (p) => p.id,
        ),
      )
      const teamLookup = new Map(
        (await db.select().from(nhlTeams)).map((t) => [t.abbrev, t.id]),
      )

      // Fetch all skaters from realtime report (has all players who appeared)
      const skaterRows = await fetchAllPages<{
        playerId: number
        skaterFullName: string
        positionCode: string
        teamAbbrevs: string
        shootsCatches: string
      }>((pageStart) =>
        endpoints.statsReport.skater('realtime', {
          seasonId: season,
          gameTypeId: 2,
          start: pageStart,
          limit: PAGE_SIZE,
        }),
      )

      // Fetch all goalies
      const goalieRows = await fetchAllPages<{
        playerId: number
        goalieFullName: string
        teamAbbrevs: string
      }>((pageStart) =>
        endpoints.statsReport.goalie('advanced', {
          seasonId: season,
          gameTypeId: 2,
          start: pageStart,
          limit: PAGE_SIZE,
        }),
      )

      let created = 0
      for (const row of skaterRows) {
        if (existingPlayerIds.has(row.playerId)) continue
        const teamAbbrev = row.teamAbbrevs?.split(',')[0]?.trim() ?? ''
        const nameParts = row.skaterFullName.split(' ')
        const firstName = nameParts[0] ?? ''
        const lastName = nameParts.slice(1).join(' ') ?? ''
        await db
          .insert(nhlPlayers)
          .values({
            id: row.playerId,
            firstName,
            lastName,
            position: row.positionCode,
            teamId: teamLookup.get(teamAbbrev) ?? null,
            teamAbbrev,
            shootsCatches: row.shootsCatches ?? null,
            isActive: false,
          })
          .onConflictDoUpdate({
            target: nhlPlayers.id,
            set: { teamAbbrev },
          })
        existingPlayerIds.add(row.playerId)
        created++
      }

      for (const row of goalieRows) {
        if (existingPlayerIds.has(row.playerId)) continue
        const teamAbbrev = row.teamAbbrevs?.split(',')[0]?.trim() ?? ''
        const nameParts = row.goalieFullName.split(' ')
        const firstName = nameParts[0] ?? ''
        const lastName = nameParts.slice(1).join(' ') ?? ''
        await db
          .insert(nhlPlayers)
          .values({
            id: row.playerId,
            firstName,
            lastName,
            position: 'G',
            teamId: teamLookup.get(teamAbbrev) ?? null,
            teamAbbrev,
            isActive: false,
          })
          .onConflictDoUpdate({
            target: nhlPlayers.id,
            set: { teamAbbrev },
          })
        existingPlayerIds.add(row.playerId)
        created++
      }

      if (created > 0) {
        console.log(
          `[backfill] advanced: ${seasonLabel(season)} — created ${created} missing player records`,
        )
      }
    } catch (err) {
      console.warn(
        `[backfill] advanced: ${seasonLabel(season)} — failed to pre-populate players, some rows may be skipped`,
        err instanceof Error ? err.message : err,
      )
    }

    for (const gameTypeId of [2, 3]) {
      // Skater reports
      for (const config of SKATER_REPORTS) {
        const minSeason = SKATER_REPORT_START[config.report] ?? 20052006
        if (season < minSeason) continue

        try {
          const rows = await fetchAllPages((pageStart) =>
            endpoints.statsReport.skater(config.report, {
              seasonId: season,
              gameTypeId,
              start: pageStart,
              limit: PAGE_SIZE,
            }),
          )

          let skipped = 0
          for (const row of rows) {
            const transformed = config.transform(
              row as never,
              gameTypeId,
              snapshotDate,
            )
            try {
              await db
                .insert(nhlSkaterAdvancedStats)
                .values(transformed)
                .onConflictDoUpdate({
                  target: nhlSkaterAdvancedStats.id,
                  set: config.conflictSet(transformed),
                })
              seasonCount++
            } catch {
              skipped++
            }
          }

          if (skipped > 0) {
            console.warn(
              `[backfill] advanced: skater/${config.report} ${seasonLabel(season)} gt=${gameTypeId} — ${skipped} rows skipped (missing player FK)`,
            )
          }

          await sleep(DELAY_MS)
        } catch (err) {
          errors++
          console.error(
            `[backfill] advanced: skater/${config.report} ${seasonLabel(season)} gt=${gameTypeId} FAILED`,
            err instanceof Error ? err.message : err,
          )
        }
      }

      // Goalie reports
      for (const config of GOALIE_REPORTS) {
        const minSeason = GOALIE_REPORT_START[config.report] ?? 20072008
        if (season < minSeason) continue

        try {
          const rows = await fetchAllPages((pageStart) =>
            endpoints.statsReport.goalie(config.report, {
              seasonId: season,
              gameTypeId,
              start: pageStart,
              limit: PAGE_SIZE,
            }),
          )

          let skipped = 0
          for (const row of rows) {
            const transformed = config.transform(
              row as never,
              gameTypeId,
              snapshotDate,
            )
            try {
              await db
                .insert(nhlGoalieAdvancedStats)
                .values(transformed)
                .onConflictDoUpdate({
                  target: nhlGoalieAdvancedStats.id,
                  set: config.conflictSet(transformed),
                })
              seasonCount++
            } catch {
              skipped++
            }
          }

          if (skipped > 0) {
            console.warn(
              `[backfill] advanced: goalie/${config.report} ${seasonLabel(season)} gt=${gameTypeId} — ${skipped} rows skipped (missing player FK)`,
            )
          }

          await sleep(DELAY_MS)
        } catch (err) {
          errors++
          console.error(
            `[backfill] advanced: goalie/${config.report} ${seasonLabel(season)} gt=${gameTypeId} FAILED`,
            err instanceof Error ? err.message : err,
          )
        }
      }
    }

    total += seasonCount
    console.log(
      `[backfill] advanced: ${seasonLabel(season)} (${i + 1}/${seasons.length}) — ${seasonCount} records`,
    )
  }

  console.log(
    `[backfill] Phase 6 done: ${total} advanced stat upserts (${errors} errors) in ${elapsed(start)}`,
  )
  return total
}

// ---------------------------------------------------------------------------
// Phase 7: Repair (fix data inconsistencies in existing DB)
// ---------------------------------------------------------------------------
async function repairData(): Promise<number> {
  console.log('\n[backfill] Repair: Fixing team names and metadata')
  const start = Date.now()
  let fixed = 0

  // Re-fetch the team list from the stats API
  const { data } = await nhlFetch<NhlStatsRestResponse<NhlTeamListEntry>>(
    endpoints.team.list(),
  )
  const byCode = new Map<string, NhlTeamListEntry>()
  for (const team of data.data) {
    const existing = byCode.get(team.triCode)
    if (!existing || team.id > existing.id) {
      byCode.set(team.triCode, team)
    }
  }

  // Fetch current standings to identify active teams
  const { data: standingsData } = await nhlFetch<NhlStandingsResponse>(
    endpoints.standings.now(),
  )
  const activeAbbrevs = new Set(
    standingsData.standings.map((s) => s.teamAbbrev.default),
  )

  // Re-stamp active teams from standings
  for (const standing of standingsData.standings) {
    const abbrev = standing.teamAbbrev.default
    const teamEntry = byCode.get(abbrev)
    if (!teamEntry) continue

    await db
      .update(nhlTeams)
      .set({
        name: standing.teamCommonName.default,
        fullName: standing.teamName.default,
        conference: standing.conferenceName,
        conferenceAbbrev: standing.conferenceAbbrev,
        division: standing.divisionName,
        divisionAbbrev: standing.divisionAbbrev,
        logoUrl: standing.teamLogo,
      })
      .where(eq(nhlTeams.id, teamEntry.id))
    console.log(
      `[repair] team ${abbrev}: name="${standing.teamCommonName.default}", fullName="${standing.teamName.default}"`,
    )
    fixed++
  }

  // Fix defunct teams: extract common name from fullName
  const allTeams = await db.select().from(nhlTeams)
  for (const team of allTeams) {
    if (activeAbbrevs.has(team.abbrev)) continue
    if (team.name !== team.fullName) continue // already has distinct names

    const commonName = extractCommonName(team.fullName)
    if (commonName !== team.name) {
      await db
        .update(nhlTeams)
        .set({ name: commonName })
        .where(eq(nhlTeams.id, team.id))
      console.log(
        `[repair] team ${team.abbrev}: "${team.name}" → "${commonName}"`,
      )
      fixed++
    }
  }

  console.log(`[backfill] Repair done: ${fixed} fixes in ${elapsed(start)}`)
  return fixed
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const PHASES = [
  'teams',
  'standings',
  'rosters',
  'players',
  'game-logs',
  'scores',
  'advanced',
  'repair',
] as const
type Phase = (typeof PHASES)[number]

async function main() {
  console.log('='.repeat(60))
  console.log('[backfill] NHL Historical Data Backfill')
  console.log('='.repeat(60))

  // Validate phase filter
  if (PHASE_FILTER && !PHASES.includes(PHASE_FILTER as Phase)) {
    console.error(`[backfill] Invalid phase: ${PHASE_FILTER}`)
    console.error(`[backfill] Valid phases: ${PHASES.join(', ')}`)
    process.exit(1)
  }

  // Fetch valid season list from NHL API
  const { data: allSeasons } = await nhlFetch<number[]>(endpoints.season.list())
  const seasons = allSeasons.filter((s) => s >= FROM_SEASON && s <= TO_SEASON)

  if (seasons.length === 0) {
    console.error(
      `[backfill] No seasons found in range ${FROM_SEASON}–${TO_SEASON}`,
    )
    process.exit(1)
  }

  console.log(
    `[backfill] Seasons: ${seasonLabel(seasons[0])} → ${seasonLabel(seasons[seasons.length - 1])} (${seasons.length} seasons)`,
  )
  console.log(
    `[backfill] Delay: ${DELAY_MS}ms | Batch size: ${BATCH_SIZE}${SNAPSHOTS ? ' | Daily snapshots: ON' : ''}`,
  )
  if (PHASE_FILTER) console.log(`[backfill] Running phase: ${PHASE_FILTER}`)
  console.log(
    `[backfill] Database: ${process.env.DATABASE_URL ? 'connected' : 'DATABASE_URL not set'}`,
  )

  const mainStart = Date.now()
  const shouldRun = (phase: Phase) => !PHASE_FILTER || PHASE_FILTER === phase

  const summary: { phase: string; records: number }[] = []

  if (shouldRun('teams')) {
    const n = await backfillTeams(seasons)
    summary.push({ phase: 'teams', records: n })
  }

  if (shouldRun('standings')) {
    const n = await backfillStandings(seasons)
    summary.push({ phase: 'standings', records: n })
  }

  if (shouldRun('rosters')) {
    const n = await backfillRosters(seasons)
    summary.push({ phase: 'rosters', records: n })
  }

  if (shouldRun('players')) {
    const n = await backfillPlayerStats()
    summary.push({ phase: 'players', records: n })
  }

  if (shouldRun('game-logs')) {
    const n = await backfillGameLogs(seasons)
    summary.push({ phase: 'game-logs', records: n })
  }

  if (shouldRun('scores')) {
    const n = await backfillScores(seasons)
    summary.push({ phase: 'scores', records: n })
  }

  if (shouldRun('advanced')) {
    const n = await backfillAdvancedStats(seasons)
    summary.push({ phase: 'advanced', records: n })
  }

  if (shouldRun('repair')) {
    const n = await repairData()
    summary.push({ phase: 'repair', records: n })
  }

  // Final summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('[backfill] Complete!')
  console.log('='.repeat(60))
  for (const { phase, records } of summary) {
    console.log(`  ${phase.padEnd(12)} ${records.toLocaleString()} records`)
  }
  const totalRecords = summary.reduce((sum, s) => sum + s.records, 0)
  console.log(
    `  ${'TOTAL'.padEnd(12)} ${totalRecords.toLocaleString()} records`,
  )
  console.log(`  ${'Duration'.padEnd(12)} ${elapsed(mainStart)}`)

  process.exit(0)
}

main().catch((err) => {
  console.error('[backfill] Fatal error:', err)
  process.exit(1)
})
