import type { db as DbInstance } from "@/db";
import { getTaskConfig } from "./config";

// ---------------------------------------------------------------------------
// Game state — derived from the scores heartbeat
// ---------------------------------------------------------------------------
export type GameState = "live" | "gameday" | "quiet" | "offseason";

export interface SyncContext {
	db: typeof DbInstance;
	gameState: GameState;
	setGameState: (state: GameState) => void;
	/** Archive raw JSON to blob storage (wired up later) */
	archiveRaw: (bucket: string, key: string, body: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Task definition
// ---------------------------------------------------------------------------
export interface SyncTask {
	name: string;
	/** Run the sync task. Returns number of records upserted. */
	run: (ctx: SyncContext) => Promise<number>;
	/** Get the interval in ms for this task given current game state */
	getInterval: (state: GameState) => number;
}

// ---------------------------------------------------------------------------
// Intervals (ms)
// ---------------------------------------------------------------------------
const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export const intervals = {
	scores: (s: GameState) =>
		({ live: 30 * SECOND, gameday: 5 * MINUTE, quiet: HOUR, offseason: 6 * HOUR })[s],
	standings: (s: GameState) =>
		({ live: 5 * MINUTE, gameday: 15 * MINUTE, quiet: 6 * HOUR, offseason: 24 * HOUR })[s],
	rosters: (s: GameState) =>
		({ live: 2 * HOUR, gameday: 2 * HOUR, quiet: 12 * HOUR, offseason: 24 * HOUR })[s],
	playerStats: (s: GameState) =>
		({ live: 10 * MINUTE, gameday: HOUR, quiet: 6 * HOUR, offseason: 24 * HOUR })[s],
	schedule: (s: GameState) =>
		({ live: HOUR, gameday: 6 * HOUR, quiet: 24 * HOUR, offseason: 24 * HOUR })[s],
	advancedStats: (s: GameState) =>
		({ live: HOUR, gameday: 2 * HOUR, quiet: 6 * HOUR, offseason: 24 * HOUR })[s],
};

// ---------------------------------------------------------------------------
// Cancellable sleep — resolves (never rejects) on abort for clean shutdown
// ---------------------------------------------------------------------------
export function cancellableSleep(
	ms: number,
	signal: AbortSignal,
): Promise<void> {
	if (signal.aborted) return Promise.resolve();
	return new Promise((resolve) => {
		const timer = setTimeout(() => {
			signal.removeEventListener("abort", onAbort);
			resolve();
		}, ms);

		function onAbort() {
			clearTimeout(timer);
			resolve();
		}

		signal.addEventListener("abort", onAbort, { once: true });
	});
}

// ---------------------------------------------------------------------------
// Counting semaphore — caps concurrent task executions
// ---------------------------------------------------------------------------
export interface Semaphore {
	acquire: (signal: AbortSignal) => Promise<boolean>;
	release: () => void;
}

export function createSemaphore(maxConcurrency: number): Semaphore {
	let available = maxConcurrency;
	const waiters: Array<(granted: boolean) => void> = [];

	function acquire(signal: AbortSignal): Promise<boolean> {
		if (signal.aborted) return Promise.resolve(false);

		if (available > 0) {
			available--;
			return Promise.resolve(true);
		}

		return new Promise<boolean>((resolve) => {
			const waiter = (granted: boolean) => {
				signal.removeEventListener("abort", onAbort);
				resolve(granted);
			};

			function onAbort() {
				const idx = waiters.indexOf(waiter);
				if (idx !== -1) waiters.splice(idx, 1);
				resolve(false);
			}

			signal.addEventListener("abort", onAbort, { once: true });
			waiters.push(waiter);
		});
	}

	function release() {
		if (waiters.length > 0) {
			const next = waiters.shift()!;
			next(true);
		} else {
			available++;
		}
	}

	return { acquire, release };
}

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------
const MAX_BACKOFF_MS = 5 * MINUTE;

export interface SchedulerOptions {
	maxConcurrency?: number;
}

export function createScheduler(
	tasks: SyncTask[],
	ctx: SyncContext,
	options: SchedulerOptions = {},
) {
	const { maxConcurrency = 3 } = options;
	const ac = new AbortController();
	const semaphore = createSemaphore(maxConcurrency);

	async function taskLoop(task: SyncTask, staggerMs: number) {
		const signal = ac.signal;
		let consecutiveFailures = 0;

		// Initial stagger so tasks don't all fire at once
		await cancellableSleep(staggerMs, signal);

		while (!signal.aborted) {
			// Check DB config for enabled/disabled
			const config = await getTaskConfig(ctx.db, task.name);
			if (config && !config.enabled) {
				console.log(`[sync] ${task.name}: disabled, checking again in 60s`);
				await cancellableSleep(60_000, signal);
				continue;
			}

			const acquired = await semaphore.acquire(signal);
			if (!acquired) break; // shutdown

			const startedAt = Date.now();
			try {
				const recordCount = await task.run(ctx);
				const durationMs = Date.now() - startedAt;

				consecutiveFailures = 0;
				// Prefer DB config interval, fall back to hardcoded
				const intervalMs = config
					? config.intervals[ctx.gameState]
					: task.getInterval(ctx.gameState);

				console.log(
					`[sync] ${task.name}: ${recordCount} records in ${durationMs}ms ` +
						`(next in ${Math.round(intervalMs / 1000)}s, state=${ctx.gameState})`,
				);

				semaphore.release();
				await cancellableSleep(intervalMs, signal);
			} catch (err) {
				const durationMs = Date.now() - startedAt;
				consecutiveFailures++;

				const backoff = Math.min(
					MAX_BACKOFF_MS,
					2 ** consecutiveFailures * SECOND,
				);

				console.error(
					`[sync] ${task.name}: FAILED in ${durationMs}ms ` +
						`(attempt ${consecutiveFailures}, retry in ${Math.round(backoff / 1000)}s)`,
					err instanceof Error ? err.message : err,
				);

				semaphore.release();
				await cancellableSleep(backoff, signal);
			}
		}
	}

	return {
		start: async () => {
			console.log(
				`[sync] Starting scheduler with ${tasks.length} tasks (concurrency: ${maxConcurrency})`,
			);

			const loops = tasks.map((task, i) =>
				taskLoop(task, i * 2 * SECOND),
			);

			await Promise.allSettled(loops);
			console.log("[sync] Scheduler stopped");
		},
		stop: () => {
			ac.abort();
		},
	};
}
