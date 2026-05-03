import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { nhlFetch, NhlApiError } from "./client";

describe("nhlFetch", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn());
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns parsed data and raw JSON on success", async () => {
		const mockData = { games: [{ id: 1 }] };
		const mockResponse = new Response(JSON.stringify(mockData), {
			status: 200,
		});
		vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

		const result = await nhlFetch<typeof mockData>("https://example.com");

		expect(result.data).toEqual(mockData);
		expect(JSON.parse(result.raw)).toEqual(mockData);
	});

	it("retries on 429 with exponential backoff", async () => {
		const rateLimited = new Response("", { status: 429 });
		const success = new Response(JSON.stringify({ ok: true }), {
			status: 200,
		});

		vi.mocked(fetch)
			.mockResolvedValueOnce(rateLimited)
			.mockResolvedValueOnce(success);

		const result = await nhlFetch<{ ok: boolean }>(
			"https://example.com",
			{ maxRetries: 2, baseDelayMs: 1 },
		);

		expect(result.data).toEqual({ ok: true });
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it("retries on 5xx errors", async () => {
		const serverError = new Response("", { status: 500 });
		const success = new Response(JSON.stringify({ ok: true }), {
			status: 200,
		});

		vi.mocked(fetch)
			.mockResolvedValueOnce(serverError)
			.mockResolvedValueOnce(success);

		const result = await nhlFetch<{ ok: boolean }>(
			"https://example.com",
			{ maxRetries: 2, baseDelayMs: 1 },
		);

		expect(result.data).toEqual({ ok: true });
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it("throws NhlApiError on non-retryable error", async () => {
		const notFound = new Response("", {
			status: 404,
			statusText: "Not Found",
		});
		vi.mocked(fetch).mockResolvedValueOnce(notFound);

		try {
			await nhlFetch("https://example.com/bad", { maxRetries: 1 });
			expect.unreachable("should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(NhlApiError);
			expect((err as NhlApiError).status).toBe(404);
			expect((err as NhlApiError).url).toBe("https://example.com/bad");
		}
	});

	it("exhausts retries on persistent 429", async () => {
		const rateLimited = new Response("", { status: 429 });
		vi.mocked(fetch).mockResolvedValue(rateLimited);

		await expect(
			nhlFetch("https://example.com", {
				maxRetries: 2,
				baseDelayMs: 1,
			}),
		).rejects.toThrow(NhlApiError);

		// initial + 2 retries = 3 calls
		expect(fetch).toHaveBeenCalledTimes(3);
	});

	it("respects Retry-After header on 429", async () => {
		const headers = new Headers({ "Retry-After": "1" });
		const rateLimited = new Response("", { status: 429, headers });
		const success = new Response(JSON.stringify({ ok: true }), {
			status: 200,
		});

		vi.mocked(fetch)
			.mockResolvedValueOnce(rateLimited)
			.mockResolvedValueOnce(success);

		const start = Date.now();
		await nhlFetch("https://example.com", {
			maxRetries: 1,
			baseDelayMs: 1,
		});
		const elapsed = Date.now() - start;

		// Should have waited ~1000ms from Retry-After: 1
		expect(elapsed).toBeGreaterThanOrEqual(900);
	});

	it("sends Accept: application/json header", async () => {
		const success = new Response(JSON.stringify({}), { status: 200 });
		vi.mocked(fetch).mockResolvedValueOnce(success);

		await nhlFetch("https://example.com");

		expect(fetch).toHaveBeenCalledWith("https://example.com", {
			headers: { Accept: "application/json" },
		});
	});
});
