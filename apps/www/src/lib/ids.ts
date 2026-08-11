/**
 * Identifier mints — adopted from oraq-platform's ADR-0034. Three kinds,
 * never interchangeable:
 *
 *  - `newId()` — UUIDv7 row PKs for everything this app inserts. Time-ordered,
 *    so B-tree inserts append instead of scattering. v7 embeds its mint
 *    timestamp — which is why PKs never appear in URLs (that's what public
 *    ids are for).
 *  - `newPublicId(prefix)` — the identifier that IS allowed in URLs and across
 *    service boundaries: `<prefix>_` + 11 chars base58 (~64 random bits).
 *    Random, not sortable: a sortable public id would leak row volume and
 *    creation time. (Blog posts also carry a `slug` — that's editorial and
 *    mutable; the public id is the stable name.)
 *  - Tokens are neither: secrets carried in links get a dedicated 256-bit
 *    mint when we first need one. Tokens are credentials, ids are names;
 *    a uuid is never a token.
 */
import { randomBytes } from "node:crypto";
import { v7 as uuidv7 } from "uuid";

export function newId(): string {
	return uuidv7();
}

/** Bitcoin base58: no 0/O/I/l, URL-safe, case-sensitive. */
const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export type PublicIdPrefix = "post";

/** 64 random bits → 11 base58 chars (58^11 ≈ 2^64.5, so 11 always fits; '1' is
 * the zero digit for padding). No collision-retry loop on purpose: at 2^64 the
 * birthday bound stays negligible for any row count we will ever hold, and the
 * column's UNIQUE constraint turns the impossible case into a loud insert
 * failure. */
export function newPublicId(prefix: PublicIdPrefix): string {
	let n = randomBytes(8).readBigUInt64BE();
	let body = "";
	while (n > 0n) {
		body = BASE58[Number(n % 58n)] + body;
		n /= 58n;
	}
	return `${prefix}_${body.padStart(11, "1")}`;
}
