export class NhlApiError extends Error {
	constructor(
		public status: number,
		public url: string,
		message: string,
	) {
		super(message);
		this.name = "NhlApiError";
	}
}

interface FetchOptions {
	maxRetries?: number;
	baseDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<FetchOptions> = {
	maxRetries: 3,
	baseDelayMs: 1000,
};

/**
 * Fetch JSON from an NHL API endpoint with retry and 429 backoff.
 * Returns both the parsed body and the raw JSON string (for archiving).
 */
export async function nhlFetch<T>(
	url: string,
	opts?: FetchOptions,
): Promise<{ data: T; raw: string }> {
	const { maxRetries, baseDelayMs } = { ...DEFAULT_OPTIONS, ...opts };

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		const response = await fetch(url, {
			headers: { Accept: "application/json" },
		});

		if (response.ok) {
			const raw = await response.text();
			const data = JSON.parse(raw) as T;
			return { data, raw };
		}

		if (response.status === 429) {
			const retryAfter = response.headers.get("Retry-After");
			const delayMs = retryAfter
				? Number.parseInt(retryAfter, 10) * 1000
				: baseDelayMs * 2 ** attempt;

			console.warn(
				`[nhl-api] 429 on ${url}, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`,
			);

			if (attempt < maxRetries) {
				await sleep(delayMs);
				continue;
			}
		}

		if (response.status >= 500 && attempt < maxRetries) {
			const delayMs = baseDelayMs * 2 ** attempt;
			console.warn(
				`[nhl-api] ${response.status} on ${url}, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`,
			);
			await sleep(delayMs);
			continue;
		}

		throw new NhlApiError(
			response.status,
			url,
			`NHL API returned ${response.status}: ${response.statusText}`,
		);
	}

	// Unreachable, but TypeScript needs it
	throw new NhlApiError(0, url, "Exhausted retries");
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
