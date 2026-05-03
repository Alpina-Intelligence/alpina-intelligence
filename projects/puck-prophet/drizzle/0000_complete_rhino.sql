CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_anonymous" boolean DEFAULT false,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhl_game_goals" (
	"id" text PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"period" integer NOT NULL,
	"period_type" text NOT NULL,
	"time_in_period" text NOT NULL,
	"scorer_id" integer NOT NULL,
	"scorer_name" text NOT NULL,
	"goals_to_date" integer,
	"team_abbrev" text NOT NULL,
	"strength" text,
	"goal_modifier" text,
	"assists" jsonb,
	"home_score" integer NOT NULL,
	"away_score" integer NOT NULL,
	"highlight_url" text
);
--> statement-breakpoint
CREATE TABLE "nhl_games" (
	"id" integer PRIMARY KEY NOT NULL,
	"season" integer NOT NULL,
	"game_type" integer NOT NULL,
	"game_date" date NOT NULL,
	"start_time_utc" timestamp with time zone,
	"venue" text,
	"game_state" text NOT NULL,
	"period" integer,
	"period_type" text,
	"clock" text,
	"home_team_id" integer NOT NULL,
	"away_team_id" integer NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"home_sog" integer,
	"away_sog" integer,
	"neutral_site" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhl_goalie_season_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"season" integer NOT NULL,
	"game_type" integer NOT NULL,
	"games_played" integer NOT NULL,
	"games_started" integer,
	"wins" integer NOT NULL,
	"losses" integer NOT NULL,
	"ot_losses" integer,
	"goals_against" integer,
	"goals_against_avg" real,
	"shots_against" integer,
	"save_pctg" real,
	"shutouts" integer,
	"goals" integer,
	"assists" integer,
	"pim" integer,
	"time_on_ice" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhl_players" (
	"id" integer PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"team_id" integer,
	"team_abbrev" text,
	"position" text NOT NULL,
	"sweater_number" integer,
	"shoots_catches" text,
	"height_inches" integer,
	"weight_pounds" integer,
	"birth_date" date,
	"birth_city" text,
	"birth_country" text,
	"birth_state_province" text,
	"headshot_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhl_raw_response_cache" (
	"endpoint" text PRIMARY KEY NOT NULL,
	"params" text,
	"response_body" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhl_skater_season_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"season" integer NOT NULL,
	"game_type" integer NOT NULL,
	"games_played" integer NOT NULL,
	"goals" integer NOT NULL,
	"assists" integer NOT NULL,
	"points" integer NOT NULL,
	"plus_minus" integer,
	"pim" integer,
	"power_play_goals" integer,
	"power_play_points" integer,
	"shorthanded_goals" integer,
	"shorthanded_points" integer,
	"game_winning_goals" integer,
	"ot_goals" integer,
	"shots" integer,
	"shooting_pctg" real,
	"avg_toi" text,
	"faceoff_win_pctg" real,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhl_standings" (
	"id" text PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"team_abbrev" text NOT NULL,
	"team_id" integer NOT NULL,
	"games_played" integer NOT NULL,
	"wins" integer NOT NULL,
	"losses" integer NOT NULL,
	"ot_losses" integer NOT NULL,
	"points" integer NOT NULL,
	"point_pctg" real,
	"goal_for" integer NOT NULL,
	"goal_against" integer NOT NULL,
	"goal_differential" integer NOT NULL,
	"regulation_wins" integer,
	"regulation_plus_ot_wins" integer,
	"home_wins" integer,
	"home_losses" integer,
	"home_ot_losses" integer,
	"home_points" integer,
	"road_wins" integer,
	"road_losses" integer,
	"road_ot_losses" integer,
	"road_points" integer,
	"l10_wins" integer,
	"l10_losses" integer,
	"l10_ot_losses" integer,
	"l10_points" integer,
	"streak_code" text,
	"streak_count" integer,
	"league_sequence" integer,
	"conference_sequence" integer,
	"division_sequence" integer,
	"wildcard_sequence" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhl_sync_log" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "nhl_sync_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"task_name" text NOT NULL,
	"status" text NOT NULL,
	"duration_ms" integer,
	"records_upserted" integer,
	"error" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nhl_teams" (
	"id" integer PRIMARY KEY NOT NULL,
	"abbrev" text NOT NULL,
	"name" text NOT NULL,
	"full_name" text NOT NULL,
	"conference" text NOT NULL,
	"conference_abbrev" text NOT NULL,
	"division" text NOT NULL,
	"division_abbrev" text NOT NULL,
	"logo_url" text,
	CONSTRAINT "nhl_teams_abbrev_unique" UNIQUE("abbrev")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhl_game_goals" ADD CONSTRAINT "nhl_game_goals_game_id_nhl_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."nhl_games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhl_game_goals" ADD CONSTRAINT "nhl_game_goals_scorer_id_nhl_players_id_fk" FOREIGN KEY ("scorer_id") REFERENCES "public"."nhl_players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhl_games" ADD CONSTRAINT "nhl_games_home_team_id_nhl_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."nhl_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhl_games" ADD CONSTRAINT "nhl_games_away_team_id_nhl_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."nhl_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhl_goalie_season_stats" ADD CONSTRAINT "nhl_goalie_season_stats_player_id_nhl_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."nhl_players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhl_players" ADD CONSTRAINT "nhl_players_team_id_nhl_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."nhl_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhl_skater_season_stats" ADD CONSTRAINT "nhl_skater_season_stats_player_id_nhl_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."nhl_players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nhl_standings" ADD CONSTRAINT "nhl_standings_team_id_nhl_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."nhl_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "nhl_game_goals_game_idx" ON "nhl_game_goals" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "nhl_game_goals_scorer_idx" ON "nhl_game_goals" USING btree ("scorer_id");--> statement-breakpoint
CREATE INDEX "nhl_games_date_idx" ON "nhl_games" USING btree ("game_date");--> statement-breakpoint
CREATE INDEX "nhl_games_season_idx" ON "nhl_games" USING btree ("season");--> statement-breakpoint
CREATE INDEX "nhl_games_state_idx" ON "nhl_games" USING btree ("game_state");--> statement-breakpoint
CREATE INDEX "nhl_games_home_team_idx" ON "nhl_games" USING btree ("home_team_id");--> statement-breakpoint
CREATE INDEX "nhl_games_away_team_idx" ON "nhl_games" USING btree ("away_team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nhl_goalie_stats_unique_idx" ON "nhl_goalie_season_stats" USING btree ("player_id","season","game_type");--> statement-breakpoint
CREATE INDEX "nhl_goalie_stats_season_idx" ON "nhl_goalie_season_stats" USING btree ("season");--> statement-breakpoint
CREATE INDEX "nhl_goalie_stats_wins_idx" ON "nhl_goalie_season_stats" USING btree ("wins");--> statement-breakpoint
CREATE INDEX "nhl_players_team_idx" ON "nhl_players" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "nhl_players_position_idx" ON "nhl_players" USING btree ("position");--> statement-breakpoint
CREATE UNIQUE INDEX "nhl_skater_stats_unique_idx" ON "nhl_skater_season_stats" USING btree ("player_id","season","game_type");--> statement-breakpoint
CREATE INDEX "nhl_skater_stats_season_idx" ON "nhl_skater_season_stats" USING btree ("season");--> statement-breakpoint
CREATE INDEX "nhl_skater_stats_points_idx" ON "nhl_skater_season_stats" USING btree ("points");--> statement-breakpoint
CREATE UNIQUE INDEX "nhl_standings_season_team_idx" ON "nhl_standings" USING btree ("season_id","team_abbrev");--> statement-breakpoint
CREATE INDEX "nhl_standings_points_idx" ON "nhl_standings" USING btree ("points");--> statement-breakpoint
CREATE INDEX "nhl_sync_log_task_idx" ON "nhl_sync_log" USING btree ("task_name");--> statement-breakpoint
CREATE INDEX "nhl_sync_log_started_idx" ON "nhl_sync_log" USING btree ("started_at");