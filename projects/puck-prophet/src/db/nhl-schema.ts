import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------
export const nhlTeams = pgTable('nhl_teams', {
  id: integer('id').primaryKey(),
  abbrev: text('abbrev').notNull().unique(),
  name: text('name').notNull(),
  fullName: text('full_name').notNull(),
  conference: text('conference'),
  conferenceAbbrev: text('conference_abbrev'),
  division: text('division'),
  divisionAbbrev: text('division_abbrev'),
  logoUrl: text('logo_url'),
})

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------
export const nhlPlayers = pgTable(
  'nhl_players',
  {
    id: integer('id').primaryKey(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    teamId: integer('team_id').references(() => nhlTeams.id),
    teamAbbrev: text('team_abbrev'),
    position: text('position').notNull(),
    sweaterNumber: integer('sweater_number'),
    shootsCatches: text('shoots_catches'),
    heightInches: integer('height_inches'),
    weightPounds: integer('weight_pounds'),
    birthDate: date('birth_date'),
    birthCity: text('birth_city'),
    birthCountry: text('birth_country'),
    birthStateProvince: text('birth_state_province'),
    headshotUrl: text('headshot_url'),
    isActive: boolean('is_active').default(true).notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('nhl_players_team_idx').on(table.teamId),
    index('nhl_players_position_idx').on(table.position),
  ],
)

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------
export const nhlGames = pgTable(
  'nhl_games',
  {
    id: integer('id').primaryKey(),
    season: integer('season').notNull(),
    gameType: integer('game_type').notNull(),
    gameDate: date('game_date').notNull(),
    startTimeUtc: timestamp('start_time_utc', { withTimezone: true }),
    venue: text('venue'),
    gameState: text('game_state').notNull(),
    period: integer('period'),
    periodType: text('period_type'),
    clock: text('clock'),
    homeTeamId: integer('home_team_id')
      .notNull()
      .references(() => nhlTeams.id),
    awayTeamId: integer('away_team_id')
      .notNull()
      .references(() => nhlTeams.id),
    homeScore: integer('home_score'),
    awayScore: integer('away_score'),
    homeSog: integer('home_sog'),
    awaySog: integer('away_sog'),
    neutralSite: boolean('neutral_site').default(false).notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('nhl_games_date_idx').on(table.gameDate),
    index('nhl_games_season_idx').on(table.season),
    index('nhl_games_state_idx').on(table.gameState),
    index('nhl_games_home_team_idx').on(table.homeTeamId),
    index('nhl_games_away_team_idx').on(table.awayTeamId),
  ],
)

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------
export const nhlGameGoals = pgTable(
  'nhl_game_goals',
  {
    id: text('id').primaryKey(), // "{gameId}-{period}-{timeInPeriod}-{scorerId}"
    gameId: integer('game_id')
      .notNull()
      .references(() => nhlGames.id),
    period: integer('period').notNull(),
    periodType: text('period_type').notNull(),
    timeInPeriod: text('time_in_period').notNull(),
    scorerId: integer('scorer_id')
      .notNull()
      .references(() => nhlPlayers.id),
    scorerName: text('scorer_name').notNull(),
    goalsToDate: integer('goals_to_date'),
    teamAbbrev: text('team_abbrev').notNull(),
    strength: text('strength'),
    goalModifier: text('goal_modifier'),
    assists:
      jsonb('assists').$type<
        { playerId: number; name: string; assistsToDate: number }[]
      >(),
    homeScore: integer('home_score').notNull(),
    awayScore: integer('away_score').notNull(),
    highlightUrl: text('highlight_url'),
  },
  (table) => [
    index('nhl_game_goals_game_idx').on(table.gameId),
    index('nhl_game_goals_scorer_idx').on(table.scorerId),
  ],
)

// ---------------------------------------------------------------------------
// Standings (core + splits)
// ---------------------------------------------------------------------------
export const nhlStandings = pgTable(
  'nhl_standings',
  {
    id: text('id').primaryKey(), // "{seasonId}-{teamAbbrev}-{snapshotDate}"
    seasonId: integer('season_id').notNull(),
    teamAbbrev: text('team_abbrev').notNull(),
    snapshotDate: date('snapshot_date').notNull(),
    isCurrent: boolean('is_current').default(true).notNull(),
    teamId: integer('team_id')
      .notNull()
      .references(() => nhlTeams.id),
    // Historical conference/division (preserved per-season)
    conference: text('conference'),
    conferenceAbbrev: text('conference_abbrev'),
    division: text('division'),
    divisionAbbrev: text('division_abbrev'),
    gamesPlayed: integer('games_played').notNull(),
    wins: integer('wins').notNull(),
    losses: integer('losses').notNull(),
    otLosses: integer('ot_losses').notNull(),
    points: integer('points').notNull(),
    pointPctg: real('point_pctg'),
    goalFor: integer('goal_for').notNull(),
    goalAgainst: integer('goal_against').notNull(),
    goalDifferential: integer('goal_differential').notNull(),
    regulationWins: integer('regulation_wins'),
    regulationPlusOtWins: integer('regulation_plus_ot_wins'),
    // Home splits
    homeWins: integer('home_wins'),
    homeLosses: integer('home_losses'),
    homeOtLosses: integer('home_ot_losses'),
    homePoints: integer('home_points'),
    // Road splits
    roadWins: integer('road_wins'),
    roadLosses: integer('road_losses'),
    roadOtLosses: integer('road_ot_losses'),
    roadPoints: integer('road_points'),
    // Last 10
    l10Wins: integer('l10_wins'),
    l10Losses: integer('l10_losses'),
    l10OtLosses: integer('l10_ot_losses'),
    l10Points: integer('l10_points'),
    // Streak
    streakCode: text('streak_code'),
    streakCount: integer('streak_count'),
    // Rankings
    leagueSequence: integer('league_sequence'),
    conferenceSequence: integer('conference_sequence'),
    divisionSequence: integer('division_sequence'),
    wildcardSequence: integer('wildcard_sequence'),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('nhl_standings_season_team_idx').on(
      table.seasonId,
      table.teamAbbrev,
      table.snapshotDate,
    ),
    index('nhl_standings_points_idx').on(table.points),
    index('nhl_standings_current_idx')
      .on(table.seasonId, table.isCurrent)
      .where(sql`is_current = true`),
  ],
)

// ---------------------------------------------------------------------------
// Skater Season Stats
// ---------------------------------------------------------------------------
export const nhlSkaterSeasonStats = pgTable(
  'nhl_skater_season_stats',
  {
    id: text('id').primaryKey(), // "{playerId}-{season}-{gameType}-{snapshotDate}"
    playerId: integer('player_id')
      .notNull()
      .references(() => nhlPlayers.id),
    season: integer('season').notNull(),
    gameType: integer('game_type').notNull(),
    snapshotDate: date('snapshot_date').notNull(),
    isCurrent: boolean('is_current').default(true).notNull(),
    gamesPlayed: integer('games_played').notNull(),
    goals: integer('goals').notNull(),
    assists: integer('assists').notNull(),
    points: integer('points').notNull(),
    plusMinus: integer('plus_minus'),
    pim: integer('pim'),
    powerPlayGoals: integer('power_play_goals'),
    powerPlayPoints: integer('power_play_points'),
    shorthandedGoals: integer('shorthanded_goals'),
    shorthandedPoints: integer('shorthanded_points'),
    gameWinningGoals: integer('game_winning_goals'),
    otGoals: integer('ot_goals'),
    shots: integer('shots'),
    shootingPctg: real('shooting_pctg'),
    avgToi: text('avg_toi'),
    faceoffWinPctg: real('faceoff_win_pctg'),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('nhl_skater_stats_unique_idx').on(
      table.playerId,
      table.season,
      table.gameType,
      table.snapshotDate,
    ),
    index('nhl_skater_stats_season_idx').on(table.season),
    index('nhl_skater_stats_points_idx').on(table.points),
    index('nhl_skater_stats_current_idx')
      .on(table.season, table.isCurrent)
      .where(sql`is_current = true`),
  ],
)

// ---------------------------------------------------------------------------
// Goalie Season Stats
// ---------------------------------------------------------------------------
export const nhlGoalieSeasonStats = pgTable(
  'nhl_goalie_season_stats',
  {
    id: text('id').primaryKey(), // "{playerId}-{season}-{gameType}-{snapshotDate}"
    playerId: integer('player_id')
      .notNull()
      .references(() => nhlPlayers.id),
    season: integer('season').notNull(),
    gameType: integer('game_type').notNull(),
    snapshotDate: date('snapshot_date').notNull(),
    isCurrent: boolean('is_current').default(true).notNull(),
    gamesPlayed: integer('games_played').notNull(),
    gamesStarted: integer('games_started'),
    wins: integer('wins').notNull(),
    losses: integer('losses').notNull(),
    otLosses: integer('ot_losses'),
    goalsAgainst: integer('goals_against'),
    goalsAgainstAvg: real('goals_against_avg'),
    shotsAgainst: integer('shots_against'),
    savePctg: real('save_pctg'),
    shutouts: integer('shutouts'),
    goals: integer('goals'),
    assists: integer('assists'),
    pim: integer('pim'),
    timeOnIce: text('time_on_ice'),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('nhl_goalie_stats_unique_idx').on(
      table.playerId,
      table.season,
      table.gameType,
      table.snapshotDate,
    ),
    index('nhl_goalie_stats_season_idx').on(table.season),
    index('nhl_goalie_stats_wins_idx').on(table.wins),
    index('nhl_goalie_stats_current_idx')
      .on(table.season, table.isCurrent)
      .where(sql`is_current = true`),
  ],
)

// ---------------------------------------------------------------------------
// Skater Advanced Stats (from api.nhle.com/stats/rest)
// ---------------------------------------------------------------------------
export const nhlSkaterAdvancedStats = pgTable(
  'nhl_skater_advanced_stats',
  {
    id: text('id').primaryKey(), // "{playerId}-{seasonId}-{gameTypeId}-{snapshotDate}"
    playerId: integer('player_id')
      .notNull()
      .references(() => nhlPlayers.id),
    seasonId: integer('season_id').notNull(),
    gameTypeId: integer('game_type_id').notNull(),
    snapshotDate: date('snapshot_date').notNull(),
    isCurrent: boolean('is_current').default(true).notNull(),
    gamesPlayed: integer('games_played').notNull(),
    positionCode: text('position_code'),
    teamAbbrevs: text('team_abbrevs'),

    // -- Realtime: hits, blocks, giveaways, takeaways --
    hits: integer('hits'),
    hitsPer60: real('hits_per_60'),
    blockedShots: integer('blocked_shots'),
    blockedShotsPer60: real('blocked_shots_per_60'),
    missedShots: integer('missed_shots'),
    giveaways: integer('giveaways'),
    giveawaysPer60: real('giveaways_per_60'),
    takeaways: integer('takeaways'),
    takeawaysPer60: real('takeaways_per_60'),
    emptyNetGoals: integer('empty_net_goals'),
    emptyNetAssists: integer('empty_net_assists'),
    emptyNetPoints: integer('empty_net_points'),
    firstGoals: integer('first_goals'),
    otGoals: integer('ot_goals'),
    shotAttemptsBlocked: integer('shot_attempts_blocked'),
    totalShotAttempts: integer('total_shot_attempts'),
    timeOnIcePerGame: real('time_on_ice_per_game'),

    // -- Percentages: Corsi (SAT%), Fenwick (USAT%), PDO --
    satPercentage: real('sat_percentage'),
    satPercentageAhead: real('sat_percentage_ahead'),
    satPercentageBehind: real('sat_percentage_behind'),
    satPercentageTied: real('sat_percentage_tied'),
    satPercentageClose: real('sat_percentage_close'),
    satRelative: real('sat_relative'),
    usatPercentage: real('usat_percentage'),
    usatPercentageAhead: real('usat_percentage_ahead'),
    usatPercentageBehind: real('usat_percentage_behind'),
    usatPercentageTied: real('usat_percentage_tied'),
    usatPercentageClose: real('usat_percentage_close'),
    usatRelative: real('usat_relative'),
    shootingPct5v5: real('shooting_pct_5v5'),
    skaterSavePct5v5: real('skater_save_pct_5v5'),
    skaterShootingPlusSavePct5v5: real('skater_shooting_plus_save_pct_5v5'),
    zoneStartPct5v5: real('zone_start_pct_5v5'),
    timeOnIcePerGame5v5: real('time_on_ice_per_game_5v5'),

    // -- Scoring Rates (5v5) --
    goals5v5: integer('goals_5v5'),
    goalsPer605v5: real('goals_per_60_5v5'),
    assists5v5: integer('assists_5v5'),
    assistsPer605v5: real('assists_per_60_5v5'),
    points5v5: integer('points_5v5'),
    pointsPer605v5: real('points_per_60_5v5'),
    primaryAssists5v5: integer('primary_assists_5v5'),
    primaryAssistsPer605v5: real('primary_assists_per_60_5v5'),
    secondaryAssists5v5: integer('secondary_assists_5v5'),
    secondaryAssistsPer605v5: real('secondary_assists_per_60_5v5'),
    offensiveZoneStartPct5v5: real('offensive_zone_start_pct_5v5'),
    onIceShootingPct5v5: real('on_ice_shooting_pct_5v5'),
    netMinorPenaltiesPer60: real('net_minor_penalties_per_60'),

    // -- Goals For/Against (situational) --
    esGoalsFor: integer('es_goals_for'),
    esGoalsAgainst: integer('es_goals_against'),
    esGoalDifference: integer('es_goal_difference'),
    esGoalsForPct: real('es_goals_for_pct'),
    esToiPerGame: real('es_toi_per_game'),
    ppGoalsFor: integer('pp_goals_for'),
    ppGoalsAgainst: integer('pp_goals_against'),
    ppToiPerGame: real('pp_toi_per_game'),
    shGoalsFor: integer('sh_goals_for'),
    shGoalsAgainst: integer('sh_goals_against'),
    shToiPerGame: real('sh_toi_per_game'),

    // -- Faceoff Zone Splits --
    faceoffWinPct: real('faceoff_win_pct'),
    totalFaceoffs: integer('total_faceoffs'),
    offensiveZoneFaceoffPct: real('offensive_zone_faceoff_pct'),
    offensiveZoneFaceoffs: integer('offensive_zone_faceoffs'),
    defensiveZoneFaceoffPct: real('defensive_zone_faceoff_pct'),
    defensiveZoneFaceoffs: integer('defensive_zone_faceoffs'),
    neutralZoneFaceoffPct: real('neutral_zone_faceoff_pct'),
    neutralZoneFaceoffs: integer('neutral_zone_faceoffs'),
    evFaceoffPct: real('ev_faceoff_pct'),
    evFaceoffs: integer('ev_faceoffs'),
    ppFaceoffPct: real('pp_faceoff_pct'),
    ppFaceoffs: integer('pp_faceoffs'),
    shFaceoffPct: real('sh_faceoff_pct'),
    shFaceoffs: integer('sh_faceoffs'),

    // -- Power Play --
    ppGoals: integer('pp_goals'),
    ppAssists: integer('pp_assists'),
    ppPoints: integer('pp_points'),
    ppGoalsPer60: real('pp_goals_per_60'),
    ppPointsPer60: real('pp_points_per_60'),
    ppPrimaryAssists: integer('pp_primary_assists'),
    ppPrimaryAssistsPer60: real('pp_primary_assists_per_60'),
    ppSecondaryAssists: integer('pp_secondary_assists'),
    ppSecondaryAssistsPer60: real('pp_secondary_assists_per_60'),
    ppShots: integer('pp_shots'),
    ppShotsPer60: real('pp_shots_per_60'),
    ppShootingPct: real('pp_shooting_pct'),
    ppIndividualSatFor: integer('pp_individual_sat_for'),
    ppIndividualSatForPer60: real('pp_individual_sat_for_per_60'),
    ppToi: real('pp_toi'),
    ppToiPctPerGame: real('pp_toi_pct_per_game'),

    // -- Penalty Kill --
    shGoals: integer('sh_goals'),
    shAssists: integer('sh_assists'),
    shPoints: integer('sh_points'),
    shGoalsPer60: real('sh_goals_per_60'),
    shPointsPer60: real('sh_points_per_60'),
    shPrimaryAssists: integer('sh_primary_assists'),
    shPrimaryAssistsPer60: real('sh_primary_assists_per_60'),
    shSecondaryAssists: integer('sh_secondary_assists'),
    shSecondaryAssistsPer60: real('sh_secondary_assists_per_60'),
    shShots: integer('sh_shots'),
    shShotsPer60: real('sh_shots_per_60'),
    shShootingPct: real('sh_shooting_pct'),
    shIndividualSatFor: integer('sh_individual_sat_for'),
    shIndividualSatForPer60: real('sh_individual_sat_for_per_60'),
    shToi: real('sh_toi'),
    shToiPctPerGame: real('sh_toi_pct_per_game'),
    ppGoalsAgainstPer60: real('pp_goals_against_per_60'),

    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('nhl_skater_adv_stats_unique_idx').on(
      table.playerId,
      table.seasonId,
      table.gameTypeId,
      table.snapshotDate,
    ),
    index('nhl_skater_adv_stats_season_idx').on(table.seasonId),
    index('nhl_skater_adv_stats_player_idx').on(table.playerId),
    index('nhl_skater_adv_stats_current_idx')
      .on(table.seasonId, table.isCurrent)
      .where(sql`is_current = true`),
  ],
)

// ---------------------------------------------------------------------------
// Goalie Advanced Stats (from api.nhle.com/stats/rest)
// ---------------------------------------------------------------------------
export const nhlGoalieAdvancedStats = pgTable(
  'nhl_goalie_advanced_stats',
  {
    id: text('id').primaryKey(), // "{playerId}-{seasonId}-{gameTypeId}-{snapshotDate}"
    playerId: integer('player_id')
      .notNull()
      .references(() => nhlPlayers.id),
    seasonId: integer('season_id').notNull(),
    gameTypeId: integer('game_type_id').notNull(),
    snapshotDate: date('snapshot_date').notNull(),
    isCurrent: boolean('is_current').default(true).notNull(),
    gamesPlayed: integer('games_played').notNull(),
    teamAbbrevs: text('team_abbrevs'),

    // -- Advanced --
    qualityStart: integer('quality_start'),
    qualityStartsPct: real('quality_starts_pct'),
    completeGames: integer('complete_games'),
    completeGamePct: real('complete_game_pct'),
    incompleteGames: integer('incomplete_games'),
    goalsFor: integer('goals_for'),
    goalsForAverage: real('goals_for_average'),
    goalsAgainst: integer('goals_against'),
    goalsAgainstAverage: real('goals_against_average'),
    regulationWins: integer('regulation_wins'),
    regulationLosses: integer('regulation_losses'),
    shotsAgainstPer60: real('shots_against_per_60'),
    savePct: real('save_pct'),
    timeOnIce: real('time_on_ice'),

    // -- Saves By Strength --
    evSaves: integer('ev_saves'),
    evShotsAgainst: integer('ev_shots_against'),
    evSavePct: real('ev_save_pct'),
    evGoalsAgainst: integer('ev_goals_against'),
    ppSaves: integer('pp_saves'),
    ppShotsAgainst: integer('pp_shots_against'),
    ppSavePct: real('pp_save_pct'),
    ppGoalsAgainst: integer('pp_goals_against'),
    shSaves: integer('sh_saves'),
    shShotsAgainst: integer('sh_shots_against'),
    shSavePct: real('sh_save_pct'),
    shGoalsAgainst: integer('sh_goals_against'),
    totalSaves: integer('total_saves'),
    totalShotsAgainst: integer('total_shots_against'),
    totalSavePct: real('total_save_pct'),
    totalGoalsAgainst: integer('total_goals_against'),
    wins: integer('wins'),
    losses: integer('losses'),
    otLosses: integer('ot_losses'),

    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('nhl_goalie_adv_stats_unique_idx').on(
      table.playerId,
      table.seasonId,
      table.gameTypeId,
      table.snapshotDate,
    ),
    index('nhl_goalie_adv_stats_season_idx').on(table.seasonId),
    index('nhl_goalie_adv_stats_player_idx').on(table.playerId),
    index('nhl_goalie_adv_stats_current_idx')
      .on(table.seasonId, table.isCurrent)
      .where(sql`is_current = true`),
  ],
)

// ---------------------------------------------------------------------------
// Skater Game Logs (per-game box score stats)
// ---------------------------------------------------------------------------
export const nhlSkaterGameLogs = pgTable(
  'nhl_skater_game_logs',
  {
    id: text('id').primaryKey(), // "{playerId}-{gameId}"
    playerId: integer('player_id')
      .notNull()
      .references(() => nhlPlayers.id),
    gameId: integer('game_id').notNull(),
    season: integer('season').notNull(),
    gameType: integer('game_type').notNull(),
    gameDate: date('game_date').notNull(),
    teamAbbrev: text('team_abbrev').notNull(),
    opponentAbbrev: text('opponent_abbrev').notNull(),
    homeRoadFlag: text('home_road_flag').notNull(),
    goals: integer('goals').notNull(),
    assists: integer('assists').notNull(),
    points: integer('points').notNull(),
    plusMinus: integer('plus_minus').notNull(),
    powerPlayGoals: integer('power_play_goals').notNull(),
    powerPlayPoints: integer('power_play_points').notNull(),
    shorthandedGoals: integer('shorthanded_goals').notNull(),
    shorthandedPoints: integer('shorthanded_points').notNull(),
    gameWinningGoals: integer('game_winning_goals').notNull(),
    otGoals: integer('ot_goals').notNull(),
    shots: integer('shots').notNull(),
    shifts: integer('shifts').notNull(),
    pim: integer('pim').notNull(),
    toi: text('toi'),
  },
  (table) => [
    index('nhl_skater_gl_player_season_idx').on(table.playerId, table.season),
    index('nhl_skater_gl_game_idx').on(table.gameId),
    index('nhl_skater_gl_date_idx').on(table.gameDate),
  ],
)

// ---------------------------------------------------------------------------
// Goalie Game Logs (per-game box score stats)
// ---------------------------------------------------------------------------
export const nhlGoalieGameLogs = pgTable(
  'nhl_goalie_game_logs',
  {
    id: text('id').primaryKey(), // "{playerId}-{gameId}"
    playerId: integer('player_id')
      .notNull()
      .references(() => nhlPlayers.id),
    gameId: integer('game_id').notNull(),
    season: integer('season').notNull(),
    gameType: integer('game_type').notNull(),
    gameDate: date('game_date').notNull(),
    teamAbbrev: text('team_abbrev').notNull(),
    opponentAbbrev: text('opponent_abbrev').notNull(),
    homeRoadFlag: text('home_road_flag').notNull(),
    gamesStarted: integer('games_started').notNull(),
    decision: text('decision'),
    shotsAgainst: integer('shots_against').notNull(),
    goalsAgainst: integer('goals_against').notNull(),
    savePctg: real('save_pctg'),
    shutouts: integer('shutouts').notNull(),
    goals: integer('goals').notNull(),
    assists: integer('assists').notNull(),
    pim: integer('pim').notNull(),
    toi: text('toi'),
  },
  (table) => [
    index('nhl_goalie_gl_player_season_idx').on(table.playerId, table.season),
    index('nhl_goalie_gl_game_idx').on(table.gameId),
    index('nhl_goalie_gl_date_idx').on(table.gameDate),
  ],
)

// ---------------------------------------------------------------------------
// Sync Log
// ---------------------------------------------------------------------------
export const nhlSyncLog = pgTable(
  'nhl_sync_log',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    taskName: text('task_name').notNull(),
    status: text('status').notNull(),
    durationMs: integer('duration_ms'),
    recordsUpserted: integer('records_upserted'),
    error: text('error'),
    startedAt: timestamp('started_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('nhl_sync_log_task_idx').on(table.taskName),
    index('nhl_sync_log_started_idx').on(table.startedAt),
  ],
)

// ---------------------------------------------------------------------------
// Sync Task Configuration (DB-backed, read by scheduler each cycle)
// ---------------------------------------------------------------------------
export const nhlSyncTaskConfig = pgTable('nhl_sync_task_config', {
  taskName: text('task_name').primaryKey(),
  enabled: boolean('enabled').default(true).notNull(),
  intervalLiveMs: integer('interval_live_ms').notNull(),
  intervalGamedayMs: integer('interval_gameday_ms').notNull(),
  intervalQuietMs: integer('interval_quiet_ms').notNull(),
  intervalOffseasonMs: integer('interval_offseason_ms').notNull(),
  batchSize: integer('batch_size'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

// ---------------------------------------------------------------------------
// Engine State (single row, written by scheduler on startup + state changes)
// ---------------------------------------------------------------------------
export const nhlEngineState = pgTable('nhl_engine_state', {
  id: integer('id').primaryKey().default(1),
  gameState: text('game_state').notNull().default('quiet'),
  startedAt: timestamp('started_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

// ---------------------------------------------------------------------------
// Raw Response Cache (last response per endpoint, upsert-only, ~10-20 rows)
// Full history archived to Hetzner Object Storage (S3-compatible)
// ---------------------------------------------------------------------------
export const nhlRawResponseCache = pgTable('nhl_raw_response_cache', {
  endpoint: text('endpoint').primaryKey(),
  params: text('params'),
  responseBody: jsonb('response_body').notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const nhlTeamRelations = relations(nhlTeams, ({ many }) => ({
  players: many(nhlPlayers),
  homeGames: many(nhlGames, { relationName: 'homeTeam' }),
  awayGames: many(nhlGames, { relationName: 'awayTeam' }),
  standings: many(nhlStandings),
}))

export const nhlPlayerRelations = relations(nhlPlayers, ({ one, many }) => ({
  team: one(nhlTeams, {
    fields: [nhlPlayers.teamId],
    references: [nhlTeams.id],
  }),
  skaterStats: many(nhlSkaterSeasonStats),
  goalieStats: many(nhlGoalieSeasonStats),
  skaterAdvancedStats: many(nhlSkaterAdvancedStats),
  goalieAdvancedStats: many(nhlGoalieAdvancedStats),
  skaterGameLogs: many(nhlSkaterGameLogs),
  goalieGameLogs: many(nhlGoalieGameLogs),
  goals: many(nhlGameGoals),
}))

export const nhlGameRelations = relations(nhlGames, ({ one, many }) => ({
  homeTeam: one(nhlTeams, {
    fields: [nhlGames.homeTeamId],
    references: [nhlTeams.id],
    relationName: 'homeTeam',
  }),
  awayTeam: one(nhlTeams, {
    fields: [nhlGames.awayTeamId],
    references: [nhlTeams.id],
    relationName: 'awayTeam',
  }),
  goals: many(nhlGameGoals),
}))

export const nhlGameGoalRelations = relations(nhlGameGoals, ({ one }) => ({
  game: one(nhlGames, {
    fields: [nhlGameGoals.gameId],
    references: [nhlGames.id],
  }),
  scorer: one(nhlPlayers, {
    fields: [nhlGameGoals.scorerId],
    references: [nhlPlayers.id],
  }),
}))

export const nhlStandingsRelations = relations(nhlStandings, ({ one }) => ({
  team: one(nhlTeams, {
    fields: [nhlStandings.teamId],
    references: [nhlTeams.id],
  }),
}))

export const nhlSkaterSeasonStatsRelations = relations(
  nhlSkaterSeasonStats,
  ({ one }) => ({
    player: one(nhlPlayers, {
      fields: [nhlSkaterSeasonStats.playerId],
      references: [nhlPlayers.id],
    }),
  }),
)

export const nhlGoalieSeasonStatsRelations = relations(
  nhlGoalieSeasonStats,
  ({ one }) => ({
    player: one(nhlPlayers, {
      fields: [nhlGoalieSeasonStats.playerId],
      references: [nhlPlayers.id],
    }),
  }),
)

export const nhlSkaterAdvancedStatsRelations = relations(
  nhlSkaterAdvancedStats,
  ({ one }) => ({
    player: one(nhlPlayers, {
      fields: [nhlSkaterAdvancedStats.playerId],
      references: [nhlPlayers.id],
    }),
  }),
)

export const nhlGoalieAdvancedStatsRelations = relations(
  nhlGoalieAdvancedStats,
  ({ one }) => ({
    player: one(nhlPlayers, {
      fields: [nhlGoalieAdvancedStats.playerId],
      references: [nhlPlayers.id],
    }),
  }),
)

export const nhlSkaterGameLogRelations = relations(
  nhlSkaterGameLogs,
  ({ one }) => ({
    player: one(nhlPlayers, {
      fields: [nhlSkaterGameLogs.playerId],
      references: [nhlPlayers.id],
    }),
  }),
)

export const nhlGoalieGameLogRelations = relations(
  nhlGoalieGameLogs,
  ({ one }) => ({
    player: one(nhlPlayers, {
      fields: [nhlGoalieGameLogs.playerId],
      references: [nhlPlayers.id],
    }),
  }),
)
