/**
 * Process items in parallel batches using Promise.allSettled.
 * Returns an array of results (successes) and calls onError for failures.
 */
export async function batchProcess<T, R>(
  items: readonly T[],
  fn: (item: T) => Promise<R>,
  batchSize: number,
  onError?: (item: T, error: unknown) => void,
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const settled = await Promise.allSettled(batch.map(fn))

    for (let j = 0; j < settled.length; j++) {
      const outcome = settled[j]
      if (outcome.status === 'fulfilled') {
        results.push(outcome.value)
      } else if (onError) {
        onError(batch[j], outcome.reason)
      }
    }
  }

  return results
}
