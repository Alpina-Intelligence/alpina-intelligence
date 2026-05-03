import type { db as DbInstance } from '@/db'
import { nhlSeasons, nhlTeams } from '@/db/nhl-schema'
import { endpoints, nhlFetch } from '@/lib/nhl-api'
import { transformSeason } from '@/lib/nhl-api/transformers'
import type {
  NhlStandingsResponse,
  NhlStandingsSeasonResponse,
  NhlStatsRestResponse,
  NhlTeamListEntry,
} from '@/lib/nhl-api/types'

// Multi-word team common names that can't be derived by taking the last word
const MULTI_WORD_COMMON_NAMES: Record<string, string> = {
  'Blue Jackets': 'Blue Jackets',
  'Red Wings': 'Red Wings',
  'Maple Leafs': 'Maple Leafs',
  'Golden Knights': 'Golden Knights',
  'North Stars': 'North Stars',
  'Black Hawks': 'Black Hawks',
}

/**
 * Derive a team's common name from its full franchise name.
 * e.g. "New York Rangers" → "Rangers", "Columbus Blue Jackets" → "Blue Jackets"
 */
export function extractCommonName(fullName: string): string {
  for (const [suffix, name] of Object.entries(MULTI_WORD_COMMON_NAMES)) {
    if (fullName.endsWith(suffix)) return name
  }
  return fullName.split(' ').at(-1) ?? fullName
}

/**
 * Seed the nhl_teams table from the NHL stats REST API + current standings.
 * This is the authoritative source for team IDs, names, and conference/division.
 *
 * Safe to call multiple times — uses upserts throughout.
 *
 * @returns Number of teams upserted
 */
export async function bootstrapTeams(db: typeof DbInstance): Promise<number> {
  // Step 1: Fetch team list from stats REST API (has team IDs + full names)
  const { data } = await nhlFetch<NhlStatsRestResponse<NhlTeamListEntry>>(
    endpoints.team.list(),
  )

  // Deduplicate by triCode — keep highest ID (most recent franchise)
  const byCode = new Map<string, NhlTeamListEntry>()
  for (const team of data.data) {
    const existing = byCode.get(team.triCode)
    if (!existing || team.id > existing.id) {
      byCode.set(team.triCode, team)
    }
  }

  // Insert all teams (name = fullName initially, stamped below)
  let total = 0
  for (const team of byCode.values()) {
    await db
      .insert(nhlTeams)
      .values({
        id: team.id,
        abbrev: team.triCode,
        name: extractCommonName(team.fullName),
        fullName: team.fullName,
      })
      .onConflictDoUpdate({
        target: nhlTeams.id,
        set: {
          abbrev: team.triCode,
          name: extractCommonName(team.fullName),
          fullName: team.fullName,
        },
      })
    total++
  }

  // Step 2: Stamp current teams with proper metadata from standings
  const { data: standingsData } = await nhlFetch<NhlStandingsResponse>(
    endpoints.standings.now(),
  )

  for (const standing of standingsData.standings) {
    const abbrev = standing.teamAbbrev.default
    const teamEntry = byCode.get(abbrev)
    if (!teamEntry) continue

    await db
      .insert(nhlTeams)
      .values({
        id: teamEntry.id,
        abbrev,
        name: standing.teamCommonName.default,
        fullName: standing.teamName.default,
        conference: standing.conferenceName,
        conferenceAbbrev: standing.conferenceAbbrev,
        division: standing.divisionName,
        divisionAbbrev: standing.divisionAbbrev,
        logoUrl: standing.teamLogo,
      })
      .onConflictDoUpdate({
        target: nhlTeams.id,
        set: {
          name: standing.teamCommonName.default,
          fullName: standing.teamName.default,
          conference: standing.conferenceName,
          conferenceAbbrev: standing.conferenceAbbrev,
          division: standing.divisionName,
          divisionAbbrev: standing.divisionAbbrev,
          logoUrl: standing.teamLogo,
        },
      })
  }

  return total
}

/**
 * Seed the nhl_seasons table from the NHL standings-season API.
 * Safe to call multiple times — uses upserts.
 *
 * @returns Number of seasons upserted
 */
export async function bootstrapSeasons(db: typeof DbInstance): Promise<number> {
  const { data } = await nhlFetch<NhlStandingsSeasonResponse>(
    endpoints.season.standingsSeason(),
  )

  let total = 0
  for (const entry of data.seasons) {
    const row = transformSeason(entry)
    await db
      .insert(nhlSeasons)
      .values(row)
      .onConflictDoUpdate({
        target: nhlSeasons.id,
        set: {
          standingsStart: row.standingsStart,
          standingsEnd: row.standingsEnd,
          conferencesInUse: row.conferencesInUse,
          divisionsInUse: row.divisionsInUse,
          wildcardInUse: row.wildcardInUse,
          tiesInUse: row.tiesInUse,
        },
      })
    total++
  }

  return total
}
