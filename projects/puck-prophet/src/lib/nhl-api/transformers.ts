import type {
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
import type {
  NhlGameScore,
  NhlGoalEvent,
  NhlGoalieAdvancedRow,
  NhlGoalieGameLogEntry,
  NhlGoalieSavesByStrengthRow,
  NhlRosterPlayer,
  NhlSeasonTotal,
  NhlSkaterFaceoffPercentagesRow,
  NhlSkaterGameLogEntry,
  NhlSkaterGoalsForAgainstRow,
  NhlSkaterPenaltykillRow,
  NhlSkaterPercentagesRow,
  NhlSkaterPowerplayRow,
  NhlSkaterRealtimeRow,
  NhlSkaterScoringRatesRow,
  NhlStandingRecord,
  NhlTeamScore,
} from './types'

// Drizzle insert types
type TeamInsert = typeof nhlTeams.$inferInsert
type PlayerInsert = typeof nhlPlayers.$inferInsert
type GameInsert = typeof nhlGames.$inferInsert
type GoalInsert = typeof nhlGameGoals.$inferInsert
type StandingInsert = typeof nhlStandings.$inferInsert
type SkaterStatsInsert = typeof nhlSkaterSeasonStats.$inferInsert
type GoalieStatsInsert = typeof nhlGoalieSeasonStats.$inferInsert
type SkaterAdvancedInsert = typeof nhlSkaterAdvancedStats.$inferInsert
type GoalieAdvancedInsert = typeof nhlGoalieAdvancedStats.$inferInsert
type SkaterGameLogInsert = typeof nhlSkaterGameLogs.$inferInsert
type GoalieGameLogInsert = typeof nhlGoalieGameLogs.$inferInsert

// ---------------------------------------------------------------------------
// Teams — extracted from standings (most complete source of team metadata)
// ---------------------------------------------------------------------------
export function transformTeamFromStanding(s: NhlStandingRecord): TeamInsert {
  return {
    // Team ID isn't in the standings response, so we derive it from
    // the roster sync or use a lookup. For now we skip `id` and use
    // abbrev as the identifier during standings sync. The roster sync
    // will populate the full team record with the NHL team ID.
    id: 0, // placeholder — roster sync sets the real ID
    abbrev: s.teamAbbrev.default,
    name: s.teamCommonName.default,
    fullName: `${s.teamName.default}`,
    conference: s.conferenceName,
    conferenceAbbrev: s.conferenceAbbrev,
    division: s.divisionName,
    divisionAbbrev: s.divisionAbbrev,
    logoUrl: s.teamLogo,
  }
}

export function transformTeamFromScore(
  t: NhlTeamScore,
  standing?: NhlStandingRecord,
): TeamInsert {
  return {
    id: t.id,
    abbrev: t.abbrev,
    name: t.name.default,
    fullName: t.name.default, // score response only has short name
    conference: standing?.conferenceName ?? '',
    conferenceAbbrev: standing?.conferenceAbbrev ?? '',
    division: standing?.divisionName ?? '',
    divisionAbbrev: standing?.divisionAbbrev ?? '',
    logoUrl: t.logo,
  }
}

// ---------------------------------------------------------------------------
// Players — from roster endpoint
// ---------------------------------------------------------------------------
export function transformPlayer(
  p: NhlRosterPlayer,
  teamId: number,
  teamAbbrev: string,
): PlayerInsert {
  return {
    id: p.id,
    firstName: p.firstName.default,
    lastName: p.lastName.default,
    teamId,
    teamAbbrev,
    position: p.positionCode,
    sweaterNumber: p.sweaterNumber,
    shootsCatches: p.shootsCatches,
    heightInches: p.heightInInches,
    weightPounds: p.weightInPounds,
    birthDate: p.birthDate,
    birthCity: p.birthCity.default,
    birthCountry: p.birthCountry,
    birthStateProvince: p.birthStateProvince?.default ?? null,
    headshotUrl: p.headshot,
    isActive: true,
  }
}

// ---------------------------------------------------------------------------
// Games — from score endpoint
// ---------------------------------------------------------------------------
export function transformGame(g: NhlGameScore): GameInsert {
  return {
    id: g.id,
    season: g.season,
    gameType: g.gameType,
    gameDate: g.gameDate,
    startTimeUtc: new Date(g.startTimeUTC),
    venue: g.venue.default,
    gameState: g.gameState,
    period: g.period ?? null,
    periodType: g.periodDescriptor?.periodType ?? null,
    clock: g.clock?.timeRemaining ?? null,
    homeTeamId: g.homeTeam.id,
    awayTeamId: g.awayTeam.id,
    homeScore: g.homeTeam.score ?? null,
    awayScore: g.awayTeam.score ?? null,
    homeSog: g.homeTeam.sog ?? null,
    awaySog: g.awayTeam.sog ?? null,
    neutralSite: g.neutralSite,
  }
}

// ---------------------------------------------------------------------------
// Goals — from score endpoint
// ---------------------------------------------------------------------------
export function transformGoal(goal: NhlGoalEvent, gameId: number): GoalInsert {
  return {
    id: `${gameId}-${goal.period}-${goal.timeInPeriod}-${goal.playerId}`,
    gameId,
    period: goal.period,
    periodType: goal.periodDescriptor.periodType,
    timeInPeriod: goal.timeInPeriod,
    scorerId: goal.playerId,
    scorerName: `${goal.firstName.default} ${goal.lastName.default}`,
    goalsToDate: goal.goalsToDate,
    teamAbbrev: goal.teamAbbrev,
    strength: goal.strength,
    goalModifier: goal.goalModifier,
    assists: goal.assists.map((a) => ({
      playerId: a.playerId,
      name: a.name.default,
      assistsToDate: a.assistsToDate,
    })),
    homeScore: goal.homeScore,
    awayScore: goal.awayScore,
    highlightUrl: goal.highlightClipSharingUrl ?? null,
  }
}

// ---------------------------------------------------------------------------
// Standings — from standings endpoint
// ---------------------------------------------------------------------------
export function transformStanding(
  s: NhlStandingRecord,
  teamId: number,
  snapshotDate: string = new Date().toISOString().slice(0, 10),
): StandingInsert {
  return {
    id: `${s.seasonId}-${s.teamAbbrev.default}-${snapshotDate}`,
    seasonId: s.seasonId,
    teamAbbrev: s.teamAbbrev.default,
    snapshotDate,
    isCurrent: true,
    teamId,
    conference: s.conferenceName,
    conferenceAbbrev: s.conferenceAbbrev,
    division: s.divisionName,
    divisionAbbrev: s.divisionAbbrev,
    gamesPlayed: s.gamesPlayed,
    wins: s.wins,
    losses: s.losses,
    otLosses: s.otLosses,
    points: s.points,
    pointPctg: s.pointPctg,
    goalFor: s.goalFor,
    goalAgainst: s.goalAgainst,
    goalDifferential: s.goalDifferential,
    regulationWins: s.regulationWins,
    regulationPlusOtWins: s.regulationPlusOtWins,
    homeWins: s.homeWins,
    homeLosses: s.homeLosses,
    homeOtLosses: s.homeOtLosses,
    homePoints: s.homePoints,
    roadWins: s.roadWins,
    roadLosses: s.roadLosses,
    roadOtLosses: s.roadOtLosses,
    roadPoints: s.roadPoints,
    l10Wins: s.l10Wins,
    l10Losses: s.l10Losses,
    l10OtLosses: s.l10OtLosses,
    l10Points: s.l10Points,
    streakCode: s.streakCode,
    streakCount: s.streakCount,
    leagueSequence: s.leagueSequence,
    conferenceSequence: s.conferenceSequence,
    divisionSequence: s.divisionSequence,
    wildcardSequence: s.wildcardSequence,
  }
}

// ---------------------------------------------------------------------------
// Skater Season Stats — from player landing seasonTotals
// ---------------------------------------------------------------------------
export function transformSkaterSeasonStats(
  playerId: number,
  st: NhlSeasonTotal,
  snapshotDate: string = new Date().toISOString().slice(0, 10),
): SkaterStatsInsert {
  return {
    id: `${playerId}-${st.season}-${st.gameTypeId}-${snapshotDate}`,
    playerId,
    season: st.season,
    gameType: st.gameTypeId,
    snapshotDate,
    isCurrent: true,
    gamesPlayed: st.gamesPlayed,
    goals: st.goals ?? 0,
    assists: st.assists ?? 0,
    points: st.points ?? 0,
    plusMinus: st.plusMinus ?? null,
    pim: st.pim ?? null,
    powerPlayGoals: st.powerPlayGoals ?? null,
    powerPlayPoints: st.powerPlayPoints ?? null,
    shorthandedGoals: st.shorthandedGoals ?? null,
    shorthandedPoints: st.shorthandedPoints ?? null,
    gameWinningGoals: st.gameWinningGoals ?? null,
    otGoals: st.otGoals ?? null,
    shots: st.shots ?? null,
    shootingPctg: st.shootingPctg ?? null,
    avgToi: st.avgToi ?? null,
    faceoffWinPctg: st.faceoffWinningPctg ?? null,
  }
}

// ---------------------------------------------------------------------------
// Goalie Season Stats — from player landing seasonTotals
// ---------------------------------------------------------------------------
export function transformGoalieSeasonStats(
  playerId: number,
  st: NhlSeasonTotal,
  snapshotDate: string = new Date().toISOString().slice(0, 10),
): GoalieStatsInsert {
  return {
    id: `${playerId}-${st.season}-${st.gameTypeId}-${snapshotDate}`,
    playerId,
    season: st.season,
    gameType: st.gameTypeId,
    snapshotDate,
    isCurrent: true,
    gamesPlayed: st.gamesPlayed,
    gamesStarted: st.gamesStarted ?? null,
    wins: st.wins ?? 0,
    losses: st.losses ?? 0,
    otLosses: st.otLosses ?? null,
    goalsAgainst: st.goalsAgainst ?? null,
    goalsAgainstAvg: st.goalsAgainstAvg ?? null,
    shotsAgainst: st.shotsAgainst ?? null,
    savePctg: st.savePctg ?? null,
    shutouts: st.shutouts ?? null,
    goals: st.goals ?? null,
    assists: st.assists ?? null,
    pim: st.pim ?? null,
    timeOnIce: st.timeOnIce ?? null,
  }
}

// ---------------------------------------------------------------------------
// Game Logs — per-game player box score stats
// ---------------------------------------------------------------------------

export function transformSkaterGameLog(
  playerId: number,
  entry: NhlSkaterGameLogEntry,
  season: number,
  gameType: number,
): SkaterGameLogInsert {
  return {
    id: `${playerId}-${entry.gameId}`,
    playerId,
    gameId: entry.gameId,
    season,
    gameType,
    gameDate: entry.gameDate,
    teamAbbrev: entry.teamAbbrev,
    opponentAbbrev: entry.opponentAbbrev,
    homeRoadFlag: entry.homeRoadFlag,
    goals: entry.goals,
    assists: entry.assists,
    points: entry.points,
    plusMinus: entry.plusMinus,
    powerPlayGoals: entry.powerPlayGoals,
    powerPlayPoints: entry.powerPlayPoints,
    shorthandedGoals: entry.shorthandedGoals,
    shorthandedPoints: entry.shorthandedPoints,
    gameWinningGoals: entry.gameWinningGoals,
    otGoals: entry.otGoals,
    shots: entry.shots,
    shifts: entry.shifts,
    pim: entry.pim,
    toi: entry.toi,
  }
}

export function transformGoalieGameLog(
  playerId: number,
  entry: NhlGoalieGameLogEntry,
  season: number,
  gameType: number,
): GoalieGameLogInsert {
  return {
    id: `${playerId}-${entry.gameId}`,
    playerId,
    gameId: entry.gameId,
    season,
    gameType,
    gameDate: entry.gameDate,
    teamAbbrev: entry.teamAbbrev,
    opponentAbbrev: entry.opponentAbbrev,
    homeRoadFlag: entry.homeRoadFlag,
    gamesStarted: entry.gamesStarted,
    decision: entry.decision ?? null,
    shotsAgainst: entry.shotsAgainst,
    goalsAgainst: entry.goalsAgainst,
    savePctg: entry.savePctg,
    shutouts: entry.shutouts,
    goals: entry.goals,
    assists: entry.assists,
    pim: entry.pim,
    toi: entry.toi,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if a seasonTotal entry is for a goalie (has goalie-specific fields) */
export function isGoalieSeasonTotal(st: NhlSeasonTotal): boolean {
  return st.savePctg !== undefined || st.goalsAgainstAvg !== undefined
}

/** Filter season totals to only NHL regular season and playoffs */
export function nhlSeasonTotals(totals: NhlSeasonTotal[]): NhlSeasonTotal[] {
  return totals.filter(
    (st) =>
      st.leagueAbbrev === 'NHL' && (st.gameTypeId === 2 || st.gameTypeId === 3),
  )
}

/** Derive current NHL season ID from the date (e.g. 20252026 for 2025-26 season) */
export function currentSeasonId(): number {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startYear = month >= 7 ? year : year - 1
  return startYear * 10000 + (startYear + 1)
}

// ---------------------------------------------------------------------------
// Advanced Stats Transformers — from api.nhle.com/stats/rest
// ---------------------------------------------------------------------------

function advancedId(
  playerId: number,
  seasonId: number,
  gameTypeId: number,
  snapshotDate: string,
) {
  return `${playerId}-${seasonId}-${gameTypeId}-${snapshotDate}`
}

export function transformSkaterRealtime(
  row: NhlSkaterRealtimeRow,
  gameTypeId: number,
  snapshotDate: string = new Date().toISOString().slice(0, 10),
): SkaterAdvancedInsert {
  return {
    id: advancedId(row.playerId, row.seasonId, gameTypeId, snapshotDate),
    playerId: row.playerId,
    seasonId: row.seasonId,
    gameTypeId,
    snapshotDate,
    isCurrent: true,
    gamesPlayed: row.gamesPlayed,
    positionCode: row.positionCode,
    teamAbbrevs: row.teamAbbrevs,
    hits: row.hits,
    hitsPer60: row.hitsPer60,
    blockedShots: row.blockedShots,
    blockedShotsPer60: row.blockedShotsPer60,
    missedShots: row.missedShots,
    giveaways: row.giveaways,
    giveawaysPer60: row.giveawaysPer60,
    takeaways: row.takeaways,
    takeawaysPer60: row.takeawaysPer60,
    emptyNetGoals: row.emptyNetGoals,
    emptyNetAssists: row.emptyNetAssists,
    emptyNetPoints: row.emptyNetPoints,
    firstGoals: row.firstGoals,
    otGoals: row.otGoals,
    shotAttemptsBlocked: row.shotAttemptsBlocked,
    totalShotAttempts: row.totalShotAttempts,
    timeOnIcePerGame: row.timeOnIcePerGame,
  }
}

export function transformSkaterPercentages(
  row: NhlSkaterPercentagesRow,
  gameTypeId: number,
  snapshotDate: string = new Date().toISOString().slice(0, 10),
): SkaterAdvancedInsert {
  return {
    id: advancedId(row.playerId, row.seasonId, gameTypeId, snapshotDate),
    playerId: row.playerId,
    seasonId: row.seasonId,
    gameTypeId,
    snapshotDate,
    isCurrent: true,
    gamesPlayed: row.gamesPlayed,
    positionCode: row.positionCode,
    teamAbbrevs: row.teamAbbrevs,
    satPercentage: row.satPercentage,
    satPercentageAhead: row.satPercentageAhead,
    satPercentageBehind: row.satPercentageBehind,
    satPercentageTied: row.satPercentageTied,
    satPercentageClose: row.satPercentageClose,
    satRelative: row.satRelative,
    usatPercentage: row.usatPercentage,
    usatPercentageAhead: row.usatPercentageAhead,
    usatPercentageBehind: row.usatPercentageBehind,
    usatPercentageTied: row.usatPercentageTied,
    usatPercentageClose: row.usatPrecentageClose, // API typo
    usatRelative: row.usatRelative,
    shootingPct5v5: row.shootingPct5v5,
    skaterSavePct5v5: row.skaterSavePct5v5,
    skaterShootingPlusSavePct5v5: row.skaterShootingPlusSavePct5v5,
    zoneStartPct5v5: row.zoneStartPct5v5,
    timeOnIcePerGame5v5: row.timeOnIcePerGame5v5,
  }
}

export function transformSkaterScoringRates(
  row: NhlSkaterScoringRatesRow,
  gameTypeId: number,
  snapshotDate: string = new Date().toISOString().slice(0, 10),
): SkaterAdvancedInsert {
  return {
    id: advancedId(row.playerId, row.seasonId, gameTypeId, snapshotDate),
    playerId: row.playerId,
    seasonId: row.seasonId,
    gameTypeId,
    snapshotDate,
    isCurrent: true,
    gamesPlayed: row.gamesPlayed,
    positionCode: row.positionCode,
    teamAbbrevs: row.teamAbbrevs,
    goals5v5: row.goals5v5,
    goalsPer605v5: row.goalsPer605v5,
    assists5v5: row.assists5v5,
    assistsPer605v5: row.assistsPer605v5,
    points5v5: row.points5v5,
    pointsPer605v5: row.pointsPer605v5,
    primaryAssists5v5: row.primaryAssists5v5,
    primaryAssistsPer605v5: row.primaryAssistsPer605v5,
    secondaryAssists5v5: row.secondaryAssists5v5,
    secondaryAssistsPer605v5: row.secondaryAssistsPer605v5,
    offensiveZoneStartPct5v5: row.offensiveZoneStartPct5v5,
    onIceShootingPct5v5: row.onIceShootingPct5v5,
    netMinorPenaltiesPer60: row.netMinorPenaltiesPer60,
  }
}

export function transformSkaterGoalsForAgainst(
  row: NhlSkaterGoalsForAgainstRow,
  gameTypeId: number,
  snapshotDate: string = new Date().toISOString().slice(0, 10),
): SkaterAdvancedInsert {
  return {
    id: advancedId(row.playerId, row.seasonId, gameTypeId, snapshotDate),
    playerId: row.playerId,
    seasonId: row.seasonId,
    gameTypeId,
    snapshotDate,
    isCurrent: true,
    gamesPlayed: row.gamesPlayed,
    positionCode: row.positionCode,
    teamAbbrevs: row.teamAbbrevs,
    esGoalsFor: row.evenStrengthGoalsFor,
    esGoalsAgainst: row.evenStrengthGoalsAgainst,
    esGoalDifference: row.evenStrengthGoalDifference,
    esGoalsForPct: row.evenStrengthGoalsForPct,
    esToiPerGame: row.evenStrengthTimeOnIcePerGame,
    ppGoalsFor: row.powerPlayGoalFor,
    ppGoalsAgainst: row.powerPlayGoalsAgainst,
    ppToiPerGame: row.powerPlayTimeOnIcePerGame,
    shGoalsFor: row.shortHandedGoalsFor,
    shGoalsAgainst: row.shortHandedGoalsAgainst,
    shToiPerGame: row.shortHandedTimeOnIcePerGame,
  }
}

export function transformSkaterFaceoffs(
  row: NhlSkaterFaceoffPercentagesRow,
  gameTypeId: number,
  snapshotDate: string = new Date().toISOString().slice(0, 10),
): SkaterAdvancedInsert {
  return {
    id: advancedId(row.playerId, row.seasonId, gameTypeId, snapshotDate),
    playerId: row.playerId,
    seasonId: row.seasonId,
    gameTypeId,
    snapshotDate,
    isCurrent: true,
    gamesPlayed: row.gamesPlayed,
    positionCode: row.positionCode,
    teamAbbrevs: row.teamAbbrevs,
    faceoffWinPct: row.faceoffWinPct,
    totalFaceoffs: row.totalFaceoffs,
    offensiveZoneFaceoffPct: row.offensiveZoneFaceoffPct,
    offensiveZoneFaceoffs: row.offensiveZoneFaceoffs,
    defensiveZoneFaceoffPct: row.defensiveZoneFaceoffPct,
    defensiveZoneFaceoffs: row.defensiveZoneFaceoffs,
    neutralZoneFaceoffPct: row.neutralZoneFaceoffPct,
    neutralZoneFaceoffs: row.neutralZoneFaceoffs,
    evFaceoffPct: row.evFaceoffPct,
    evFaceoffs: row.evFaceoffs,
    ppFaceoffPct: row.ppFaceoffPct,
    ppFaceoffs: row.ppFaceoffs,
    shFaceoffPct: row.shFaceoffPct,
    shFaceoffs: row.shFaceoffs,
  }
}

export function transformSkaterPowerplay(
  row: NhlSkaterPowerplayRow,
  gameTypeId: number,
  snapshotDate: string = new Date().toISOString().slice(0, 10),
): SkaterAdvancedInsert {
  return {
    id: advancedId(row.playerId, row.seasonId, gameTypeId, snapshotDate),
    playerId: row.playerId,
    seasonId: row.seasonId,
    gameTypeId,
    snapshotDate,
    isCurrent: true,
    gamesPlayed: row.gamesPlayed,
    positionCode: row.positionCode,
    teamAbbrevs: row.teamAbbrevs,
    ppGoals: row.ppGoals,
    ppAssists: row.ppAssists,
    ppPoints: row.ppPoints,
    ppGoalsPer60: row.ppGoalsPer60,
    ppPointsPer60: row.ppPointsPer60,
    ppPrimaryAssists: row.ppPrimaryAssists,
    ppPrimaryAssistsPer60: row.ppPrimaryAssistsPer60,
    ppSecondaryAssists: row.ppSecondaryAssists,
    ppSecondaryAssistsPer60: row.ppSecondaryAssistsPer60,
    ppShots: row.ppShots,
    ppShotsPer60: row.ppShotsPer60,
    ppShootingPct: row.ppShootingPct,
    ppIndividualSatFor: row.ppIndividualSatFor,
    ppIndividualSatForPer60: row.ppIndividualSatForPer60,
    ppToi: row.ppTimeOnIce,
    ppToiPctPerGame: row.ppTimeOnIcePctPerGame,
  }
}

export function transformSkaterPenaltykill(
  row: NhlSkaterPenaltykillRow,
  gameTypeId: number,
  snapshotDate: string = new Date().toISOString().slice(0, 10),
): SkaterAdvancedInsert {
  return {
    id: advancedId(row.playerId, row.seasonId, gameTypeId, snapshotDate),
    playerId: row.playerId,
    seasonId: row.seasonId,
    gameTypeId,
    snapshotDate,
    isCurrent: true,
    gamesPlayed: row.gamesPlayed,
    positionCode: row.positionCode,
    teamAbbrevs: row.teamAbbrevs,
    shGoals: row.shGoals,
    shAssists: row.shAssists,
    shPoints: row.shPoints,
    shGoalsPer60: row.shGoalsPer60,
    shPointsPer60: row.shPointsPer60,
    shPrimaryAssists: row.shPrimaryAssists,
    shPrimaryAssistsPer60: row.shPrimaryAssistsPer60,
    shSecondaryAssists: row.shSecondaryAssists,
    shSecondaryAssistsPer60: row.shSecondaryAssistsPer60,
    shShots: row.shShots,
    shShotsPer60: row.shShotsPer60,
    shShootingPct: row.shShootingPct,
    shIndividualSatFor: row.shIndividualSatFor,
    shIndividualSatForPer60: row.shIndividualSatForPer60,
    shToi: row.shTimeOnIce,
    shToiPctPerGame: row.shTimeOnIcePctPerGame,
    ppGoalsAgainstPer60: row.ppGoalsAgainstPer60,
  }
}

export function transformGoalieAdvanced(
  row: NhlGoalieAdvancedRow,
  gameTypeId: number,
  snapshotDate: string = new Date().toISOString().slice(0, 10),
): GoalieAdvancedInsert {
  return {
    id: advancedId(row.playerId, row.seasonId, gameTypeId, snapshotDate),
    playerId: row.playerId,
    seasonId: row.seasonId,
    gameTypeId,
    snapshotDate,
    isCurrent: true,
    gamesPlayed: row.gamesPlayed,
    teamAbbrevs: row.teamAbbrevs,
    qualityStart: row.qualityStart,
    qualityStartsPct: row.qualityStartsPct,
    completeGames: row.completeGames,
    completeGamePct: row.completeGamePct,
    incompleteGames: row.incompleteGames,
    goalsFor: row.goalsFor,
    goalsForAverage: row.goalsForAverage,
    goalsAgainst: row.goalsAgainst,
    goalsAgainstAverage: row.goalsAgainstAverage,
    regulationWins: row.regulationWins,
    regulationLosses: row.regulationLosses,
    shotsAgainstPer60: row.shotsAgainstPer60,
    savePct: row.savePct,
    timeOnIce: row.timeOnIce,
  }
}

export function transformGoalieSavesByStrength(
  row: NhlGoalieSavesByStrengthRow,
  gameTypeId: number,
  snapshotDate: string = new Date().toISOString().slice(0, 10),
): GoalieAdvancedInsert {
  return {
    id: advancedId(row.playerId, row.seasonId, gameTypeId, snapshotDate),
    playerId: row.playerId,
    seasonId: row.seasonId,
    gameTypeId,
    snapshotDate,
    isCurrent: true,
    gamesPlayed: row.gamesPlayed,
    teamAbbrevs: row.teamAbbrevs,
    evSaves: row.evSaves,
    evShotsAgainst: row.evShotsAgainst,
    evSavePct: row.evSavePct,
    evGoalsAgainst: row.evGoalsAgainst,
    ppSaves: row.ppSaves,
    ppShotsAgainst: row.ppShotsAgainst,
    ppSavePct: row.ppSavePct,
    ppGoalsAgainst: row.ppGoalsAgainst,
    shSaves: row.shSaves,
    shShotsAgainst: row.shShotsAgainst,
    shSavePct: row.shSavePct,
    shGoalsAgainst: row.shGoalsAgainst,
    totalSaves: row.saves,
    totalShotsAgainst: row.shotsAgainst,
    totalSavePct: row.savePct,
    totalGoalsAgainst: row.goalsAgainst,
    wins: row.wins,
    losses: row.losses,
    otLosses: row.otLosses,
  }
}
