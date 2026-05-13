#!/usr/bin/env bun
/**
 * Seeds the books table from the dev EPUB corpus in dev-data/epubs/.
 * Idempotent: skips files whose storage_key is already present.
 * Run with: bun run seed:books
 *
 * Title/author are derived from the filename for now. When we add EPUB
 * metadata parsing (OPF), this script becomes the place to enrich rows.
 */
import { readdirSync } from 'node:fs'
import { db } from '../src/db/client.ts'
import { books } from '../src/db/schema.ts'
import { STORAGE_ROOT } from '../src/lib/storage.ts'

type Meta = { title: string; author: string }

// Filename → display metadata. Hand-curated for the dev corpus.
const META: Record<string, Meta> = {
  'standardebooks_frankenstein.epub': {
    title: 'Frankenstein',
    author: 'Mary Shelley',
  },
  'standardebooks_alice.epub': {
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
  },
  'standardebooks_time-machine.epub': {
    title: 'The Time Machine',
    author: 'H. G. Wells',
  },
  'standardebooks_heart-of-darkness.epub': {
    title: 'Heart of Darkness',
    author: 'Joseph Conrad',
  },
  'craphound_little-brother.epub': {
    title: 'Little Brother',
    author: 'Cory Doctorow',
  },
  'archive_shakespeare-complete-works.epub': {
    title: 'The Complete Works of William Shakespeare',
    author: 'William Shakespeare',
  },
}

const fallbackMeta = (filename: string): Meta => ({
  title: filename.replace(/\.epub$/, '').replace(/[_-]/g, ' '),
  author: 'Unknown',
})

const files = readdirSync(STORAGE_ROOT).filter((f) => f.endsWith('.epub'))
if (files.length === 0) {
  console.log('No .epub files found. Run `bun run fetch:epubs` first.')
  process.exit(0)
}

let inserted = 0
let skipped = 0
for (const filename of files) {
  const { title, author } = META[filename] ?? fallbackMeta(filename)
  const result = await db
    .insert(books)
    .values({ title, author, storageKey: filename })
    .onConflictDoNothing({ target: books.storageKey })
    .returning({ publicId: books.publicId })
  if (result.length > 0) {
    console.log(`+ ${filename} (${result[0].publicId}) — ${title}`)
    inserted++
  } else {
    console.log(`= ${filename} (already present)`)
    skipped++
  }
}

console.log(`\nDone. ${inserted} inserted, ${skipped} already present.`)
process.exit(0)
