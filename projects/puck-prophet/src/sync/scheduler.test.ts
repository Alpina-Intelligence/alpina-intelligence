import { describe, expect, it, vi } from 'vitest'
import {
  cancellableSleep,
  createSemaphore,
  type GameState,
  intervals,
} from './scheduler'

describe('intervals', () => {
  const states: GameState[] = ['live', 'gameday', 'quiet', 'offseason']

  describe('scores', () => {
    it('returns 30s for live games', () => {
      expect(intervals.scores('live')).toBe(30_000)
    })

    it('returns 5min for game day', () => {
      expect(intervals.scores('gameday')).toBe(5 * 60_000)
    })

    it('returns 1hr for quiet', () => {
      expect(intervals.scores('quiet')).toBe(60 * 60_000)
    })

    it('returns 6hr for offseason', () => {
      expect(intervals.scores('offseason')).toBe(6 * 60 * 60_000)
    })
  })

  describe('standings', () => {
    it('returns 5min for live games', () => {
      expect(intervals.standings('live')).toBe(5 * 60_000)
    })

    it('returns 24hr for offseason', () => {
      expect(intervals.standings('offseason')).toBe(24 * 60 * 60_000)
    })
  })

  describe('all intervals are positive numbers', () => {
    for (const state of states) {
      it(`all intervals are > 0 for state: ${state}`, () => {
        expect(intervals.scores(state)).toBeGreaterThan(0)
        expect(intervals.standings(state)).toBeGreaterThan(0)
        expect(intervals.rosters(state)).toBeGreaterThan(0)
        expect(intervals.playerStats(state)).toBeGreaterThan(0)
        expect(intervals.schedule(state)).toBeGreaterThan(0)
      })
    }
  })

  describe('intervals decrease as urgency increases', () => {
    it('scores: live < gameday < quiet < offseason', () => {
      expect(intervals.scores('live')).toBeLessThan(intervals.scores('gameday'))
      expect(intervals.scores('gameday')).toBeLessThan(
        intervals.scores('quiet'),
      )
      expect(intervals.scores('quiet')).toBeLessThan(
        intervals.scores('offseason'),
      )
    })

    it('standings: live < gameday < quiet < offseason', () => {
      expect(intervals.standings('live')).toBeLessThan(
        intervals.standings('gameday'),
      )
      expect(intervals.standings('gameday')).toBeLessThan(
        intervals.standings('quiet'),
      )
      expect(intervals.standings('quiet')).toBeLessThan(
        intervals.standings('offseason'),
      )
    })

    it('playerStats: live < gameday < quiet', () => {
      expect(intervals.playerStats('live')).toBeLessThan(
        intervals.playerStats('gameday'),
      )
      expect(intervals.playerStats('gameday')).toBeLessThan(
        intervals.playerStats('quiet'),
      )
    })
  })
})

describe('cancellableSleep', () => {
  it('resolves after the specified duration', async () => {
    vi.useFakeTimers()
    const ac = new AbortController()
    let resolved = false

    cancellableSleep(1000, ac.signal).then(() => {
      resolved = true
    })

    await vi.advanceTimersByTimeAsync(999)
    expect(resolved).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    expect(resolved).toBe(true)

    vi.useRealTimers()
  })

  it('resolves immediately when aborted', async () => {
    vi.useFakeTimers()
    const ac = new AbortController()
    let resolved = false

    cancellableSleep(60_000, ac.signal).then(() => {
      resolved = true
    })

    ac.abort()
    await vi.advanceTimersByTimeAsync(0)
    expect(resolved).toBe(true)

    vi.useRealTimers()
  })

  it('resolves immediately if signal is already aborted', async () => {
    const ac = new AbortController()
    ac.abort()

    const start = Date.now()
    await cancellableSleep(60_000, ac.signal)
    expect(Date.now() - start).toBeLessThan(50)
  })
})

describe('createSemaphore', () => {
  it('grants up to maxConcurrency immediately', async () => {
    const sem = createSemaphore(2)
    const ac = new AbortController()

    expect(await sem.acquire(ac.signal)).toBe(true)
    expect(await sem.acquire(ac.signal)).toBe(true)
  })

  it('blocks when at max capacity and unblocks on release', async () => {
    const sem = createSemaphore(1)
    const ac = new AbortController()

    expect(await sem.acquire(ac.signal)).toBe(true)

    let thirdGranted = false
    const thirdPromise = sem.acquire(ac.signal).then((granted) => {
      thirdGranted = granted
      return granted
    })

    // Should still be waiting
    await Promise.resolve()
    expect(thirdGranted).toBe(false)

    // Release frees the waiter
    sem.release()
    expect(await thirdPromise).toBe(true)
    expect(thirdGranted).toBe(true)
  })

  it('releases waiters in FIFO order', async () => {
    const sem = createSemaphore(1)
    const ac = new AbortController()
    const order: number[] = []

    await sem.acquire(ac.signal)

    const p1 = sem.acquire(ac.signal).then(() => order.push(1))
    const p2 = sem.acquire(ac.signal).then(() => order.push(2))

    sem.release()
    await p1
    sem.release()
    await p2

    expect(order).toEqual([1, 2])
  })

  it('returns false when aborted while waiting', async () => {
    const sem = createSemaphore(1)
    const ac = new AbortController()

    await sem.acquire(ac.signal)

    const waitPromise = sem.acquire(ac.signal)
    ac.abort()

    expect(await waitPromise).toBe(false)
  })

  it('returns false if signal is already aborted', async () => {
    const sem = createSemaphore(1)
    const ac = new AbortController()
    ac.abort()

    expect(await sem.acquire(ac.signal)).toBe(false)
  })
})
