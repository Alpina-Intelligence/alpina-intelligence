CREATE TABLE "nhl_seasons" (
	"id" integer PRIMARY KEY NOT NULL,
	"standings_start" date NOT NULL,
	"standings_end" date NOT NULL,
	"conferences_in_use" boolean NOT NULL,
	"divisions_in_use" boolean NOT NULL,
	"wildcard_in_use" boolean NOT NULL,
	"ties_in_use" boolean NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
