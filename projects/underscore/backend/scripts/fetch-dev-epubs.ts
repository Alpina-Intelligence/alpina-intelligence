#!/usr/bin/env bun
/**
 * Downloads a small dev/test corpus of EPUB files into backend/dev-data/epubs/.
 * Idempotent: skips files that already exist. Run with: bun run fetch:epubs
 */
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'dev-data', 'epubs')

type Source = { filename: string; url: string; note?: string }

// Standard Ebooks serves an interstitial unless ?source=download is set.
const SE = (path: string) =>
  `https://standardebooks.org/ebooks/${path}?source=download`

const sources: Array<Source> = [
  {
    filename: 'standardebooks_frankenstein.epub',
    url: SE('mary-shelley/frankenstein/downloads/mary-shelley_frankenstein.epub'),
    note: 'Standard Ebooks — clean, well-formatted reference',
  },
  {
    filename: 'standardebooks_alice.epub',
    url: SE(
      'lewis-carroll/alices-adventures-in-wonderland/john-tenniel/downloads/lewis-carroll_alices-adventures-in-wonderland_john-tenniel.epub',
    ),
    note: 'SE — has illustrations (Tenniel)',
  },
  {
    filename: 'standardebooks_time-machine.epub',
    url: SE('h-g-wells/the-time-machine/downloads/h-g-wells_the-time-machine.epub'),
  },
  {
    filename: 'standardebooks_heart-of-darkness.epub',
    url: SE(
      'joseph-conrad/heart-of-darkness/downloads/joseph-conrad_heart-of-darkness.epub',
    ),
  },
  {
    filename: 'craphound_little-brother.epub',
    url: 'https://craphound.com/littlebrother/Cory_Doctorow_-_Little_Brother.epub',
    note: 'Cory Doctorow CC-licensed novel — modern formatting',
  },
  {
    filename: 'archive_shakespeare-complete-works.epub',
    url: 'https://archive.org/download/completeworksofs01shak/completeworksofs01shak.epub',
    note: 'Internet Archive — scruffy OCR\'d scan, exercise the parser',
  },
]

mkdirSync(outDir, { recursive: true })

let okCount = 0
let skippedCount = 0
const failed: Array<string> = []

for (const src of sources) {
  const dest = join(outDir, src.filename)
  if (existsSync(dest)) {
    console.log(`✓ ${src.filename} (skipped, already present)`)
    skippedCount++
    continue
  }
  process.stdout.write(`↓ ${src.filename} ... `)
  try {
    const res = await fetch(src.url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 underscore-dev-fetch' },
      signal: AbortSignal.timeout(60_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('epub')) {
      throw new Error(`unexpected content-type: ${ct}`)
    }
    await Bun.write(dest, res)
    const sizeKb = Math.round(Bun.file(dest).size / 1024)
    console.log(`${sizeKb} KB`)
    okCount++
  } catch (err) {
    console.log(`FAILED (${err instanceof Error ? err.message : String(err)})`)
    failed.push(src.filename)
  }
}

console.log(
  `\nDone. ${okCount} downloaded, ${skippedCount} already present, ${failed.length} failed.`,
)
if (failed.length > 0) {
  console.log('Failed:', failed.join(', '))
  process.exit(1)
}
