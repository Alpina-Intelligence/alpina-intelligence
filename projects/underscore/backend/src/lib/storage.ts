import { join } from 'node:path'

const ROOT = join(import.meta.dir, '..', '..', 'dev-data', 'epubs')

export const resolveStorageKey = (key: string): string => {
  if (key.includes('..') || key.includes('/')) {
    throw new Error(`invalid storage key: ${key}`)
  }
  return join(ROOT, key)
}

export const STORAGE_ROOT = ROOT
