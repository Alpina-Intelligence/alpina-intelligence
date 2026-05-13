# Underscore — CLAUDE.md

## Zod version: 4.x

We use **zod 4** (`^4.0.0`). String-format validators moved to top-level — use `z.uuid()`, `z.url()`, `z.email()`, `z.cuid()`, `z.datetime()`, etc. The chained `z.string().uuid()` / `z.string().url()` form is deprecated and emits TS warnings. Type inference still uses `z.infer<typeof X>` (unchanged).

## Schema sharing pattern

`shared/src/schemas/<resource>.ts` is the source of truth for HTTP API contracts. For each resource, export **named variants** alongside the canonical schema rather than relying on consumers to derive them with `.omit()` / `.partial()` inline:

```ts
export const bookSchema = z.object({ /* full domain shape */ })
export const bookCreateInput = bookSchema.omit({ id: true, addedAt: true })
export const bookUpdateInput = bookCreateInput.partial()

export type Book = z.infer<typeof bookSchema>
export type BookCreateInput = z.infer<typeof bookCreateInput>
export type BookUpdateInput = z.infer<typeof bookUpdateInput>
```

Backend routes and frontend forms both import the variant by name. This keeps request/response contracts identical across the wire.

The Drizzle table in `backend/src/db/schema.ts` is a **separate** concern, hand-written to match. DB columns the API never exposes (audit fields, soft deletes, internal flags) live only there — don't auto-derive in either direction.

If DB ↔ zod drift becomes a real burden, layer `drizzle-zod` *inside backend* for DB-side validation, but `shared/` keeps API contracts.

## Dual-ID convention (UUIDv7 + nanoid public_id)

Every API-exposed domain table has **two** IDs. The internal one never crosses the wire.

- **`id uuid`** — UUIDv7, generated app-side via `uuid` package's `v7()`. Used for PKs, FKs, joins. Never appears in API responses or URLs.
- **`public_id text`** — 12-char nanoid, unique. The only identifier exposed to clients. URL params, response bodies, anything the frontend can see.

**Always use the helpers in `backend/src/db/columns.ts`** when defining a table — don't write `id`/`public_id`/`created_at`/`updated_at` columns by hand:

```ts
import { publicIdColumns, timestampColumns } from './columns.ts'

export const myThings = pgTable('my_things', {
  ...publicIdColumns(),     // id (uuid v7) + publicId (nanoid 12)
  // domain columns here, FKs reference other tables' .id (uuid)
  ...timestampColumns(),    // createdAt + updatedAt
})
```

Use `internalIdColumns()` (no public_id) only for tables that are never exposed via the API — junction tables, audit/event logs. Better Auth tables use `uuid` PKs but **no public_id** (auth flows don't share IDs in URLs); this is configured via `advanced.database.generateId: () => uuidv7()` in `backend/src/lib/auth.ts`.

### `auth-schema.ts` is codegen — don't DRY it up

`backend/src/db/auth-schema.ts` is emitted by `bunx @better-auth/cli generate` and gets regenerated on Better Auth upgrades (or when adding plugins like 2FA/organization). It hand-writes `created_at` / `updated_at` columns instead of spreading `...timestampColumns()`, and hand-writes its `id uuid` PK instead of using `...internalIdColumns()`.

**Do not refactor it to use those helpers.** Manual edits get overwritten on the next regenerate, so any DRY-ing-up will silently vanish. The duplication is the price of letting Better Auth own its schema shape. If `timestampColumns()` or `internalIdColumns()` changes meaningfully and you want auth tables to follow, port the change *manually* into `auth-schema.ts` and accept that the next regenerate may revert it.

(The ID half is already in sync by construction: the helper generates uuidv7 via `$defaultFn`, and Better Auth generates uuidv7 via its `advanced.database.generateId` hook — same effect, different mechanism.)

### Wire-shape rule

Shared zod schemas use `publicIdSchema` (re-exported from `shared/src/schemas/books.ts`) for any field a client sees, including the row's own `id`:

```ts
export const fooSchema = z.object({
  id: publicIdSchema,           // public_id, renamed for the wire
  parentId: publicIdSchema,     // FK exposed as the parent's public_id
  // ...
})
```

In Hono routes:
- **Lookup**: `eq(table.publicId, c.req.valid('param').id)` — the `:id` route param is the public ID.
- **Response**: pass each row through `toWire(row)` from `backend/src/lib/wire.ts` — it drops the internal uuid, renames `publicId` → `id`. Never return a row directly with `c.json(row)`.
- **Cross-table FKs in responses**: when the wire shape needs a parent's public_id (e.g. `bookId` on a library entry), join and select the parent's `publicId` rather than its uuid.

Frontend code should never see or construct an internal uuid — if a route param or response field is a UUID, that's a bug.

## EPUB storage and serving

EPUB files live on disk (eventually object storage) and are served as opaque
binary blobs. The `books` table carries a `storage_key` (text, not null,
unique) — a bare filename, no path. `backend/src/lib/storage.ts`'s
`resolveStorageKey()` is the only place that maps a key to an absolute path;
swap it when migrating to S3/R2.

- **Dev seeding**: `bun run seed:books` reads
  `backend/dev-data/epubs/` and inserts one row per `.epub` (idempotent
  on `storage_key`). EPUBs themselves are fetched separately via
  `bun run fetch:epubs`.
- **Serve**: `GET /books/:id/file` streams the file with
  `Content-Type: application/epub+zip` and
  `Cache-Control: public, max-age=31536000, immutable`. Files are
  immutable per `public_id`, so aggressive caching is safe.
- **Frontend access**: never assemble URLs by hand. Use `bookFileQuery(id)`
  from `frontend/src/lib/queries.ts` — the React Query factory handles
  dedup, cancellation, and a 10-minute `gcTime` on the blob.

## foliate-js as git submodule

The EPUB renderer (`<foliate-view>` web component) lives at
`frontend/vendor/foliate-js/` as a git submodule. After fresh clone:

```bash
git submodule update --init
```

The Reader component (`frontend/src/components/reader.tsx`) imports
`view.js` for its side effect (registers the custom element), then opens
the EPUB blob. After `view.open(file)`, **call `view.next()` once** to
advance to the first page — the paginator loads the book but doesn't
render until first navigation. Reference: `vendor/foliate-js/reader.js:121`.

## React Query keys

| Key prefix       | Payload  | Lifecycle                                   |
| ---------------- | -------- | ------------------------------------------- |
| `['books']`      | JSON     | Default `staleTime` from `router.tsx`       |
| `['book', id]`   | JSON     | Default                                     |
| `['book-file', id]` | `Blob` | `staleTime: Infinity`, `gcTime: 10 minutes` |

Books are immutable per `public_id`, so the file blob stays cached
forever within a session and gets dropped from memory 10 minutes after
the last consumer unmounts.
