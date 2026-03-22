// ---------------------------------------------------------------------------
// NHL API response types — modeled from live endpoint responses
// Only the fields we actually use are typed; extra fields are ignored by TS
// ---------------------------------------------------------------------------

// Common patterns
export interface LocalizedName {
  default: string
  fr?: string
}

// ---------------------------------------------------------------------------
// stats/rest/en/team
// ---------------------------------------------------------------------------
export interface NhlTeamListEntry {
  id: number
  fullName: string
  triCode: string
  rawTricode: string
  leagueId: number
  franchiseId: number
}

// ---------------------------------------------------------------------------
// v1/score/now and v1/score/{date}
// ---------------------------------------------------------------------------
export interface NhlScoreResponse {
  prevDate: string
  currentDate: string
  nextDate: string
  games: NhlGameScore[]
}

export interface NhlGameScore {
  id: number
  season: number
  gameType: number
  gameDate: string
  startTimeUTC: string
  venue: LocalizedName
  gameState: string // "FUT" | "LIVE" | "CRIT" | "OFF" | "FINAL"
  gameScheduleState: string
  neutralSite: boolean
  period?: number
  periodDescriptor?: NhlPeriodDescriptor
  clock?: {
    timeRemaining: string
    secondsRemaining: number
    running: boolean
    inIntermission: boolean
  }
  awayTeam: NhlTeamScore
  homeTeam: NhlTeamScore
  goals?: NhlGoalEvent[]
  gameOutcome?: {
    lastPeriodType: string
    otPeriods?: number
  }
}

export interface NhlTeamScore {
  id: number
  name: LocalizedName
  abbrev: string
  score?: number
  sog?: number
  logo: string
}

export interface NhlPeriodDescriptor {
  number: number
  periodType: string // "REG" | "OT" | "SO"
  maxRegulationPeriods?: number
}

export interface NhlGoalEvent {
  period: number
  periodDescriptor: NhlPeriodDescriptor
  timeInPeriod: string
  playerId: number
  name: LocalizedName
  firstName: LocalizedName
  lastName: LocalizedName
  goalModifier: string
  assists: NhlAssist[]
  mugshot: string
  teamAbbrev: string
  goalsToDate: number
  awayScore: number
  homeScore: number
  strength: string
  highlightClipSharingUrl?: string
}

export interface NhlAssist {
  playerId: number
  name: LocalizedName
  assistsToDate: number
}

// ---------------------------------------------------------------------------
// v1/standings/now
// ---------------------------------------------------------------------------
export interface NhlStandingsResponse {
  wildCardIndicator: boolean
  standings: NhlStandingRecord[]
}

export interface NhlStandingRecord {
  teamAbbrev: LocalizedName
  teamName: LocalizedName
  teamCommonName: LocalizedName
  teamLogo: string
  conferenceAbbrev: string
  conferenceName: string
  divisionAbbrev: string
  divisionName: string
  seasonId: number
  gameTypeId: number
  gamesPlayed: number
  wins: number
  losses: number
  otLosses: number
  points: number
  pointPctg: number
  goalFor: number
  goalAgainst: number
  goalDifferential: number
  regulationWins: number
  regulationPlusOtWins: number
  homeWins: number
  homeLosses: number
  homeOtLosses: number
  homePoints: number
  roadWins: number
  roadLosses: number
  roadOtLosses: number
  roadPoints: number
  l10Wins: number
  l10Losses: number
  l10OtLosses: number
  l10Points: number
  streakCode: string
  streakCount: number
  leagueSequence: number
  conferenceSequence: number
  divisionSequence: number
  wildcardSequence: number
  waiversSequence: number
  // We skip the 12 sub-ranking sequences (home/road/L10 per league/conf/div)
}

// ---------------------------------------------------------------------------
// v1/roster/{team}/current
// ---------------------------------------------------------------------------
export interface NhlRosterResponse {
  forwards: NhlRosterPlayer[]
  defensemen: NhlRosterPlayer[]
  goalies: NhlRosterPlayer[]
}

export interface NhlRosterPlayer {
  id: number
  headshot: string
  firstName: LocalizedName
  lastName: LocalizedName
  sweaterNumber: number
  positionCode: string
  shootsCatches: string
  heightInInches: number
  weightInPounds: number
  heightInCentimeters: number
  weightInKilograms: number
  birthDate: string
  birthCity: LocalizedName
  birthCountry: string
  birthStateProvince?: LocalizedName
}

// ---------------------------------------------------------------------------
// v1/player/{id}/landing
// ---------------------------------------------------------------------------
export interface NhlPlayerLandingResponse {
  playerId: number
  isActive: boolean
  currentTeamId?: number
  currentTeamAbbrev?: string
  firstName: LocalizedName
  lastName: LocalizedName
  position: string
  sweaterNumber?: number
  headshot: string
  heroImage?: string
  heightInInches: number
  weightInPounds: number
  birthDate: string
  birthCity: LocalizedName
  birthCountry: string
  birthStateProvince?: LocalizedName
  shootsCatches: string
  featuredStats?: {
    season: number
    regularSeason?: {
      subSeason: NhlSkaterFeaturedStats | NhlGoalieFeaturedStats
      career: NhlSkaterFeaturedStats | NhlGoalieFeaturedStats
    }
  }
  seasonTotals: NhlSeasonTotal[]
}

export interface NhlSkaterFeaturedStats {
  gamesPlayed: number
  goals: number
  assists: number
  points: number
  plusMinus: number
  pim: number
  gameWinningGoals: number
  otGoals: number
  shots: number
  shootingPctg: number
  powerPlayGoals: number
  powerPlayPoints: number
  shorthandedGoals: number
  shorthandedPoints: number
}

export interface NhlGoalieFeaturedStats {
  gamesPlayed: number
  wins: number
  losses: number
  otLosses: number
  goalsAgainstAvg: number
  savePctg: number
  shutouts: number
}

// seasonTotals entries vary by position — we union the fields
export interface NhlSeasonTotal {
  season: number
  gameTypeId: number
  leagueAbbrev: string
  teamName: LocalizedName
  sequence: number
  gamesPlayed: number
  // Skater fields
  goals?: number
  assists?: number
  points?: number
  plusMinus?: number
  pim?: number
  powerPlayGoals?: number
  powerPlayPoints?: number
  shorthandedGoals?: number
  shorthandedPoints?: number
  gameWinningGoals?: number
  otGoals?: number
  shots?: number
  shootingPctg?: number
  avgToi?: string
  faceoffWinningPctg?: number
  // Goalie fields
  gamesStarted?: number
  wins?: number
  losses?: number
  otLosses?: number
  goalsAgainst?: number
  goalsAgainstAvg?: number
  shotsAgainst?: number
  savePctg?: number
  shutouts?: number
  timeOnIce?: string
}

// ---------------------------------------------------------------------------
// api.nhle.com/stats/rest — Generic response wrapper
// ---------------------------------------------------------------------------
export interface NhlStatsRestResponse<T> {
  data: T[]
  total: number
}

// ---------------------------------------------------------------------------
// Skater report row types (stats REST API)
// ---------------------------------------------------------------------------

/** /en/skater/realtime */
export interface NhlSkaterRealtimeRow {
  playerId: number
  skaterFullName: string
  lastName: string
  positionCode: string
  seasonId: number
  teamAbbrevs: string
  shootsCatches: string
  gamesPlayed: number
  hits: number
  hitsPer60: number
  blockedShots: number
  blockedShotsPer60: number
  missedShots: number
  giveaways: number
  giveawaysPer60: number
  takeaways: number
  takeawaysPer60: number
  emptyNetAssists: number
  emptyNetGoals: number
  emptyNetPoints: number
  firstGoals: number
  otGoals: number
  shotAttemptsBlocked: number
  totalShotAttempts: number
  timeOnIcePerGame: number
}

/** /en/skater/percentages — Corsi (SAT%) & Fenwick (USAT%) */
export interface NhlSkaterPercentagesRow {
  playerId: number
  skaterFullName: string
  lastName: string
  positionCode: string
  seasonId: number
  teamAbbrevs: string
  shootsCatches: string
  gamesPlayed: number
  satPercentage: number | null
  satPercentageAhead: number | null
  satPercentageBehind: number | null
  satPercentageTied: number | null
  satPercentageClose: number | null
  satRelative: number | null
  usatPercentage: number | null
  usatPercentageAhead: number | null
  usatPercentageBehind: number | null
  usatPercentageTied: number | null
  usatPrecentageClose: number | null // API typo is intentional
  usatRelative: number | null
  shootingPct5v5: number | null
  skaterSavePct5v5: number | null
  skaterShootingPlusSavePct5v5: number | null
  zoneStartPct5v5: number | null
  timeOnIcePerGame5v5: number | null
}

/** /en/skater/scoringRates — 5v5 per-60 scoring */
export interface NhlSkaterScoringRatesRow {
  playerId: number
  skaterFullName: string
  lastName: string
  positionCode: string
  seasonId: number
  teamAbbrevs: string
  gamesPlayed: number
  goals5v5: number
  goalsPer605v5: number
  assists5v5: number
  assistsPer605v5: number
  points5v5: number
  pointsPer605v5: number
  primaryAssists5v5: number
  primaryAssistsPer605v5: number
  secondaryAssists5v5: number
  secondaryAssistsPer605v5: number
  offensiveZoneStartPct5v5: number | null
  onIceShootingPct5v5: number | null
  shootingPct5v5: number | null
  satPct: number | null
  satRelative5v5: number | null
  netMinorPenaltiesPer60: number | null
  timeOnIcePerGame5v5: number
}

/** /en/skater/goalsForAgainst — Situational goal splits */
export interface NhlSkaterGoalsForAgainstRow {
  playerId: number
  skaterFullName: string
  lastName: string
  positionCode: string
  seasonId: number
  teamAbbrevs: string
  gamesPlayed: number
  goals: number
  assists: number
  points: number
  evenStrengthGoalsFor: number
  evenStrengthGoalsAgainst: number
  evenStrengthGoalDifference: number
  evenStrengthGoalsForPct: number | null
  evenStrengthTimeOnIcePerGame: number
  powerPlayGoalFor: number
  powerPlayGoalsAgainst: number
  powerPlayTimeOnIcePerGame: number
  shortHandedGoalsFor: number
  shortHandedGoalsAgainst: number
  shortHandedTimeOnIcePerGame: number
}

/** /en/skater/faceoffpercentages — Zone faceoff splits */
export interface NhlSkaterFaceoffPercentagesRow {
  playerId: number
  skaterFullName: string
  lastName: string
  positionCode: string
  seasonId: number
  teamAbbrevs: string
  shootsCatches: string
  gamesPlayed: number
  faceoffWinPct: number | null
  totalFaceoffs: number
  offensiveZoneFaceoffPct: number | null
  offensiveZoneFaceoffs: number
  defensiveZoneFaceoffPct: number | null
  defensiveZoneFaceoffs: number
  neutralZoneFaceoffPct: number | null
  neutralZoneFaceoffs: number
  evFaceoffPct: number | null
  evFaceoffs: number
  ppFaceoffPct: number | null
  ppFaceoffs: number
  shFaceoffPct: number | null
  shFaceoffs: number
  timeOnIcePerGame: number
}

/** /en/skater/powerplay — PP scoring and shot attempts */
export interface NhlSkaterPowerplayRow {
  playerId: number
  skaterFullName: string
  lastName: string
  positionCode: string
  seasonId: number
  teamAbbrevs: string
  gamesPlayed: number
  ppGoals: number
  ppAssists: number
  ppPoints: number
  ppGoalsPer60: number
  ppPointsPer60: number
  ppGoalsForPer60: number
  ppPrimaryAssists: number
  ppPrimaryAssistsPer60: number
  ppSecondaryAssists: number
  ppSecondaryAssistsPer60: number
  ppShots: number
  ppShotsPer60: number
  ppShootingPct: number | null
  ppIndividualSatFor: number
  ppIndividualSatForPer60: number
  ppTimeOnIce: number
  ppTimeOnIcePerGame: number
  ppTimeOnIcePctPerGame: number
}

/** /en/skater/penaltykill — SH scoring and shot attempts */
export interface NhlSkaterPenaltykillRow {
  playerId: number
  skaterFullName: string
  lastName: string
  positionCode: string
  seasonId: number
  teamAbbrevs: string
  gamesPlayed: number
  ppGoalsAgainstPer60: number
  shGoals: number
  shAssists: number
  shPoints: number
  shGoalsPer60: number
  shPointsPer60: number
  shPrimaryAssists: number
  shPrimaryAssistsPer60: number
  shSecondaryAssists: number
  shSecondaryAssistsPer60: number
  shShots: number
  shShotsPer60: number
  shShootingPct: number | null
  shIndividualSatFor: number
  shIndividualSatForPer60: number
  shTimeOnIce: number
  shTimeOnIcePerGame: number
  shTimeOnIcePctPerGame: number
}

// ---------------------------------------------------------------------------
// Goalie report row types (stats REST API)
// ---------------------------------------------------------------------------

/** /en/goalie/advanced */
export interface NhlGoalieAdvancedRow {
  playerId: number
  goalieFullName: string
  lastName: string
  seasonId: number
  teamAbbrevs: string
  shootsCatches: string
  gamesPlayed: number
  gamesStarted: number
  qualityStart: number
  qualityStartsPct: number | null
  completeGames: number
  completeGamePct: number | null
  incompleteGames: number
  goalsFor: number
  goalsForAverage: number | null
  goalsAgainst: number
  goalsAgainstAverage: number | null
  regulationWins: number
  regulationLosses: number
  shotsAgainstPer60: number | null
  savePct: number | null
  timeOnIce: number
}

/** /en/goalie/savesByStrength — Situational save percentages */
export interface NhlGoalieSavesByStrengthRow {
  playerId: number
  goalieFullName: string
  lastName: string
  seasonId: number
  teamAbbrevs: string
  shootsCatches: string
  gamesPlayed: number
  gamesStarted: number
  evSaves: number
  evShotsAgainst: number
  evSavePct: number | null
  evGoalsAgainst: number
  ppSaves: number
  ppShotsAgainst: number
  ppSavePct: number | null
  ppGoalsAgainst: number
  shSaves: number
  shShotsAgainst: number
  shSavePct: number | null
  shGoalsAgainst: number
  saves: number
  shotsAgainst: number
  savePct: number | null
  goalsAgainst: number
  wins: number
  losses: number
  otLosses: number
  ties: number | null
}

// ---------------------------------------------------------------------------
// v1/schedule/now
// ---------------------------------------------------------------------------
export interface NhlScheduleResponse {
  nextStartDate: string
  previousStartDate: string
  gameWeek: NhlScheduleDay[]
}

export interface NhlScheduleDay {
  date: string
  dayAbbrev: string
  numberOfGames: number
  games: NhlScheduleGame[]
}

export interface NhlScheduleGame {
  id: number
  season: number
  gameType: number
  gameDate: string
  startTimeUTC: string
  venue: LocalizedName
  gameState: string
  neutralSite: boolean
  awayTeam: NhlTeamScore
  homeTeam: NhlTeamScore
  periodDescriptor?: NhlPeriodDescriptor
  gameOutcome?: {
    lastPeriodType: string
  }
}

// ---------------------------------------------------------------------------
// Player Game Log
// ---------------------------------------------------------------------------

export interface NhlPlayerGameLogResponse {
  seasonId: number
  gameTypeId: number
  gameLog?: NhlSkaterGameLogEntry[] | NhlGoalieGameLogEntry[]
}

export interface NhlSkaterGameLogEntry {
  gameId: number
  gameDate: string
  teamAbbrev: string
  homeRoadFlag: string
  opponentAbbrev: string
  commonName: LocalizedName
  opponentCommonName: LocalizedName
  goals: number
  assists: number
  points: number
  plusMinus: number
  powerPlayGoals: number
  powerPlayPoints: number
  shorthandedGoals: number
  shorthandedPoints: number
  gameWinningGoals: number
  otGoals: number
  shots: number
  shifts: number
  pim: number
  toi: string
}

export interface NhlGoalieGameLogEntry {
  gameId: number
  gameDate: string
  teamAbbrev: string
  homeRoadFlag: string
  opponentAbbrev: string
  commonName: LocalizedName
  opponentCommonName: LocalizedName
  gamesStarted: number
  decision: string
  shotsAgainst: number
  goalsAgainst: number
  savePctg: number
  shutouts: number
  goals: number
  assists: number
  pim: number
  toi: string
}
