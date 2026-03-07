const API_WEB_BASE = "https://api-web.nhle.com";
const API_STATS_BASE = "https://api.nhle.com/stats/rest";

// ---------------------------------------------------------------------------
// api-web.nhle.com endpoints
// ---------------------------------------------------------------------------

export const scores = {
	now: () => `${API_WEB_BASE}/v1/score/now`,
	byDate: (date: string) => `${API_WEB_BASE}/v1/score/${date}`,
};

export const standings = {
	now: () => `${API_WEB_BASE}/v1/standings/now`,
	byDate: (date: string) => `${API_WEB_BASE}/v1/standings/${date}`,
};

export const roster = {
	current: (team: string) => `${API_WEB_BASE}/v1/roster/${team}/current`,
	bySeason: (team: string, season: number) =>
		`${API_WEB_BASE}/v1/roster/${team}/${season}`,
};

export const player = {
	landing: (id: number) => `${API_WEB_BASE}/v1/player/${id}/landing`,
	gameLog: (id: number, season: number, gameType: number) =>
		`${API_WEB_BASE}/v1/player/${id}/game-log/${season}/${gameType}`,
	gameLogNow: (id: number) => `${API_WEB_BASE}/v1/player/${id}/game-log/now`,
};

export const schedule = {
	now: () => `${API_WEB_BASE}/v1/schedule/now`,
	byDate: (date: string) => `${API_WEB_BASE}/v1/schedule/${date}`,
	clubWeek: (team: string) =>
		`${API_WEB_BASE}/v1/club-schedule/${team}/week/now`,
	clubSeason: (team: string) =>
		`${API_WEB_BASE}/v1/club-schedule-season/${team}/now`,
};

export const season = {
	list: () => `${API_WEB_BASE}/v1/season`,
};

export const leaders = {
	skatersCurrent: () =>
		`${API_WEB_BASE}/v1/skater-stats-leaders/current`,
	goaliesCurrent: () =>
		`${API_WEB_BASE}/v1/goalie-stats-leaders/current`,
};

// ---------------------------------------------------------------------------
// api.nhle.com/stats/rest (cayenneExp query system)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Generic stats report builder (covers all report types)
// ---------------------------------------------------------------------------

interface StatsReportParams {
	seasonId: number;
	gameTypeId: number;
	limit?: number;
	start?: number;
}

export const statsReport = {
	skater: (report: string, params: StatsReportParams) => {
		const q = new URLSearchParams({
			cayenneExp: `seasonId=${params.seasonId} and gameTypeId=${params.gameTypeId}`,
			limit: String(params.limit ?? 100),
			start: String(params.start ?? 0),
		});
		return `${API_STATS_BASE}/en/skater/${report}?${q}`;
	},
	goalie: (report: string, params: StatsReportParams) => {
		const q = new URLSearchParams({
			cayenneExp: `seasonId=${params.seasonId} and gameTypeId=${params.gameTypeId}`,
			limit: String(params.limit ?? 100),
			start: String(params.start ?? 0),
		});
		return `${API_STATS_BASE}/en/goalie/${report}?${q}`;
	},
};

// ---------------------------------------------------------------------------
// Legacy stats endpoints (prefer statsReport above)
// ---------------------------------------------------------------------------

export const stats = {
	skaterSummary: (params: {
		season: number;
		limit?: number;
		start?: number;
		sort?: string;
		dir?: "ASC" | "DESC";
	}) => {
		const q = new URLSearchParams({
			cayenneExp: `seasonId=${params.season}`,
			limit: String(params.limit ?? 100),
			start: String(params.start ?? 0),
		});
		if (params.sort) {
			q.set(
				"sort",
				JSON.stringify([
					{ property: params.sort, direction: params.dir ?? "DESC" },
				]),
			);
		}
		return `${API_STATS_BASE}/en/skater/summary?${q.toString()}`;
	},
	goalieSummary: (params: {
		season: number;
		limit?: number;
		start?: number;
		sort?: string;
		dir?: "ASC" | "DESC";
	}) => {
		const q = new URLSearchParams({
			cayenneExp: `seasonId=${params.season}`,
			limit: String(params.limit ?? 100),
			start: String(params.start ?? 0),
		});
		if (params.sort) {
			q.set(
				"sort",
				JSON.stringify([
					{ property: params.sort, direction: params.dir ?? "DESC" },
				]),
			);
		}
		return `${API_STATS_BASE}/en/goalie/summary?${q.toString()}`;
	},
};
