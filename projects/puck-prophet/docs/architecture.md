# Puck Prophet Architecture

## Overview

Puck Prophet is an NHL hockey pool management app. It continuously syncs data from the NHL's public APIs into PostgreSQL, then serves a TanStack Start (SSR React) frontend for pool management, leaderboards, and live scores.

## High-Level Architecture

```mermaid
flowchart TB
    subgraph External["NHL APIs"]
        WebAPI["api-web.nhle.com<br/>(scores, standings, rosters,<br/>schedule, player stats)"]
        StatsAPI["api.nhle.com/stats/rest<br/>(advanced stats, 9 report types)"]
    end

    subgraph Backend["Backend (Bun)"]
        Sync["Sync Engine<br/>(background process)"]
        App["TanStack Start<br/>(SSR server)"]
    end

    subgraph Data["PostgreSQL (puck_prophet DB)"]
        NHL["NHL Tables (17)"]
        Auth["Auth Tables (4)"]
    end

    subgraph Admin["alpina-site"]
        AdminUI["Admin Dashboard<br/>(monitoring + config)"]
    end

    Browser["Browser"]

    WebAPI --> Sync
    StatsAPI --> Sync
    Sync -->|"Drizzle ORM<br/>upsert"| NHL
    App -->|"Drizzle ORM<br/>query"| NHL
    App -->|"Better Auth"| Auth
    AdminUI -->|"secondary DB<br/>connection"| NHL
    Browser <-->|"HTTP/SSR"| App
    Browser <-->|"HTTP/SSR"| AdminUI
```

## Sync Engine

The sync engine runs as a standalone background process (`src/sync/index.ts`). It uses a concurrent scheduler with independent task loops and a counting semaphore for concurrency control.

```mermaid
flowchart TB
    Start["scheduler.start()"] --> Loops

    subgraph Loops["Independent Task Loops (Promise.allSettled)"]
        direction LR
        T1["scores<br/>30s - 6h"]
        T2["standings<br/>5m - 24h"]
        T3["rosters<br/>2h - 24h"]
        T4["schedule<br/>1h - 24h"]
        T5["player-stats<br/>10m - 24h"]
        T6["advanced-stats<br/>1h - 24h"]
    end

    Loops --> Sem["Semaphore<br/>(max 3 concurrent)"]

    Sem --> Fetch["Fetch from NHL API"]
    Fetch --> Transform["Transform response rows"]
    Transform --> Upsert["Upsert to PostgreSQL"]
    Upsert --> Log["Write sync log"]
    Log --> Sleep["Sleep for interval"]
    Sleep --> Sem

    GS["Game State"] -.->|"adjusts intervals"| Sleep

    subgraph GameStates["Game State (set by scores task)"]
        direction LR
        Live["live"]
        Gameday["gameday"]
        Quiet["quiet"]
        Offseason["offseason"]
    end

    GS --- GameStates
```

### Tasks

| Task | Source API | Target Tables | Key Behavior |
|------|-----------|---------------|--------------|
| `scores` | `/v1/score/now` | `nhl_games`, `nhl_game_goals` | Sets game state; fastest polling |
| `standings` | `/v1/standings/now` | `nhl_standings` | Full league standings |
| `rosters` | `/v1/roster/{team}/current` | `nhl_players` | Batch processes all 32 teams |
| `schedule` | `/v1/schedule/now` | `nhl_games` | Upcoming game schedule |
| `player-stats` | `/v1/player/{id}/landing` | `nhl_skater_season_stats`, `nhl_goalie_season_stats` | Per-player, batch of 10 |
| `advanced-stats` | `/stats/rest/en/skater/{report}`, `/stats/rest/en/goalie/{report}` | `nhl_skater_advanced_stats`, `nhl_goalie_advanced_stats` | 9 reports, paginated, per-report upserts |

### Key Mechanisms

- **DB-backed config**: Task intervals, enabled state, and batch sizes stored in `nhl_sync_task_config`. Read each cycle with 30s cache TTL. Falls back to hardcoded defaults if table is empty.
- **Concurrency**: Counting semaphore with FIFO waiter queue limits parallel task execution
- **Cancellation**: `cancellableSleep()` with `AbortController` enables clean shutdown on SIGINT/SIGTERM
- **Error handling**: Exponential backoff per task (up to 5 min), errors logged to `nhl_sync_log`
- **Batch processing**: `batchProcess()` utility for within-task parallelism (rosters: 8, player-stats: 10)
- **Pagination**: `fetchAllPages()` loops until `data.length < PAGE_SIZE` for stats REST API
- **Monitoring**: Engine state (game state + uptime) persisted to `nhl_engine_state`. Admin dashboard in alpina-site reads config and sync logs via secondary DB connection.

## Database Schema

```mermaid
erDiagram
    nhl_teams ||--o{ nhl_players : "has"
    nhl_teams ||--o{ nhl_standings : "has"
    nhl_teams ||--o{ nhl_games : "home_team"
    nhl_teams ||--o{ nhl_games : "away_team"

    nhl_players ||--o{ nhl_skater_season_stats : "has"
    nhl_players ||--o{ nhl_goalie_season_stats : "has"
    nhl_players ||--o{ nhl_skater_advanced_stats : "has"
    nhl_players ||--o{ nhl_goalie_advanced_stats : "has"
    nhl_players ||--o{ nhl_game_goals : "scored"

    nhl_games ||--o{ nhl_game_goals : "has"

    nhl_teams {
        int id PK
        text abbrev UK
        text name
        text conference
        text division
    }

    nhl_players {
        int id PK
        text first_name
        text last_name
        int team_id FK
        text position
        boolean is_active
    }

    nhl_games {
        int id PK
        int season
        date game_date
        text game_state
        int home_team_id FK
        int away_team_id FK
        int home_score
        int away_score
    }

    nhl_game_goals {
        text id PK
        int game_id FK
        int scorer_id FK
        int period
        text strength
    }

    nhl_standings {
        text id PK
        int season_id
        text team_abbrev
        int points
        int wins
        int losses
    }

    nhl_skater_season_stats {
        text id PK
        int player_id FK
        int season
        int goals
        int assists
        int points
    }

    nhl_goalie_season_stats {
        text id PK
        int player_id FK
        int season
        int wins
        real save_pctg
    }

    nhl_skater_advanced_stats {
        text id PK
        int player_id FK
        int season_id
        int game_type_id
        int games_played
        real sat_percentage "Corsi"
        real usat_percentage "Fenwick"
    }

    nhl_goalie_advanced_stats {
        text id PK
        int player_id FK
        int season_id
        int game_type_id
        int games_played
        real save_pct
    }

    nhl_sync_task_config {
        text task_name PK
        boolean enabled
        int interval_live_ms
        int interval_gameday_ms
        int interval_quiet_ms
        int interval_offseason_ms
        int batch_size
    }

    nhl_engine_state {
        int id PK
        text game_state
        timestamp started_at
    }

    nhl_sync_log {
        int id PK
        text task_name
        text status
        int records_upserted
    }

    nhl_raw_response_cache {
        text endpoint PK
        jsonb response_body
    }
```

### System Tables

- **`nhl_sync_task_config`** -- DB-backed task configuration (intervals per game state, enabled toggle, batch size). Read by the scheduler each cycle.
- **`nhl_engine_state`** -- Single-row table tracking current game state and engine start time. Written by the scheduler, read by the monitoring dashboard.
- **`nhl_sync_log`** -- Audit trail for every sync task run (status, duration, record count, errors)
- **`nhl_raw_response_cache`** -- Last raw API response per endpoint (planned: archive to S3-compatible object storage)

### Auth Tables (Better Auth)

| Table | Purpose |
|-------|---------|
| `user` | User accounts |
| `session` | Active sessions |
| `account` | OAuth/credential accounts |
| `anonymous_session` | Guest sessions (anonymous plugin) |

## Data Flow

```mermaid
sequenceDiagram
    participant S as Scheduler
    participant T as Task (e.g. scores)
    participant Sem as Semaphore
    participant API as NHL API
    participant DB as PostgreSQL

    S->>T: Start task loop
    loop Every interval
        T->>Sem: acquire()
        Sem-->>T: permit granted
        T->>API: GET /v1/score/now
        API-->>T: JSON response
        T->>T: Transform rows
        T->>DB: INSERT ... ON CONFLICT DO UPDATE
        T->>DB: INSERT into nhl_sync_log
        T->>Sem: release()
        T->>T: cancellableSleep(interval)
    end
```

## Frontend

### Routing (TanStack Start, file-based)

| Route | File | Description |
|-------|------|-------------|
| `/` | `routes/index.tsx` | Home / landing page |
| `/dashboard` | `routes/dashboard.tsx` | User dashboard |
| `/leaderboard` | `routes/leaderboard.tsx` | Pool leaderboard |
| `/api/auth/$` | `routes/api/auth/$.ts` | Better Auth catch-all API |

### Component Structure

```
src/components/
├── auth/           # SignInForm, SignUpForm
├── pools/          # PoolCard, PoolList
├── leaderboard/    # LeaderboardTable, LeaderboardRow, RankBadge
├── PuckProphet/    # ProphetCharacter, ProphetQuote, PredictionCard
├── ui/             # shadcn/ui (button, card, table, tabs, etc.)
├── Header.tsx
└── ThemeSwitcher.tsx
```

## Tech Stack

| Technology | Role |
|-----------|------|
| **Bun** | Runtime, package manager, script runner |
| **TanStack Start** | Full-stack React framework with SSR |
| **React 19** | UI library |
| **Tailwind CSS v4** | Utility-first styling |
| **shadcn/ui** | Component library |
| **Drizzle ORM** | Type-safe database queries and migrations |
| **PostgreSQL** | Primary data store |
| **Better Auth** | Authentication (email/password + anonymous) |
| **Vitest** | Unit and integration testing |
| **Biome** | Linting and formatting |
| **Storybook** | Component development and documentation |
