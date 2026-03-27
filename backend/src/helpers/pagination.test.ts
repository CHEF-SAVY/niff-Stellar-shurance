import { BadRequestException } from '@nestjs/common';
import {
  clampLimit,
  encodeCursor,
  decodeCursor,
  buildKeysetWhere,
  buildNextCursor,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from './pagination';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(id: number, createdAt: Date) {
  return { id, createdAt };
}

// Fixed dataset: 5 items ordered newest-first (DESC createdAt, DESC id)
const T = (offsetMs: number) => new Date(1_700_000_000_000 - offsetMs);
const ITEMS = [
  makeItem(5, T(0)),
  makeItem(4, T(1000)),
  makeItem(3, T(2000)),
  makeItem(2, T(3000)),
  makeItem(1, T(4000)),
];

// ---------------------------------------------------------------------------
// clampLimit
// ---------------------------------------------------------------------------

describe('clampLimit', () => {
  it('returns DEFAULT_LIMIT when undefined', () => {
    expect(clampLimit(undefined)).toBe(DEFAULT_LIMIT);
  });

  it('clamps values above MAX_LIMIT to MAX_LIMIT', () => {
    expect(clampLimit(9999)).toBe(MAX_LIMIT);
    expect(clampLimit(101)).toBe(MAX_LIMIT);
    expect(clampLimit(100)).toBe(MAX_LIMIT);
  });

  it('clamps values below 1 to 1', () => {
    expect(clampLimit(0)).toBe(1);
    expect(clampLimit(-5)).toBe(1);
  });

  it('passes through valid values unchanged', () => {
    expect(clampLimit(1)).toBe(1);
    expect(clampLimit(20)).toBe(20);
    expect(clampLimit(99)).toBe(99);
  });
});

// ---------------------------------------------------------------------------
// encodeCursor / decodeCursor — round-trip
// ---------------------------------------------------------------------------

describe('encodeCursor / decodeCursor', () => {
  it('round-trips createdAt and id correctly', () => {
    const date = new Date('2024-01-15T12:00:00.000Z');
    const cursor = encodeCursor(date, 42);
    const decoded = decodeCursor(cursor);
    expect(decoded.id).toBe(42);
    expect(new Date(decoded.createdAt).toISOString()).toBe(date.toISOString());
  });

  it('produces an opaque string (not raw JSON)', () => {
    const cursor = encodeCursor(new Date(), 1);
    expect(cursor).not.toContain('{');
    expect(cursor).not.toContain('"');
  });

  it('throws BadRequestException for empty string', () => {
    expect(() => decodeCursor('')).toThrow(BadRequestException);
  });

  it('throws BadRequestException for random garbage', () => {
    expect(() => decodeCursor('not-a-cursor!!!')).toThrow(BadRequestException);
  });

  it('throws BadRequestException for valid base64url but wrong shape', () => {
    const bad = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64url');
    expect(() => decodeCursor(bad)).toThrow(BadRequestException);
  });

  it('throws BadRequestException for negative id', () => {
    const bad = Buffer.from(
      JSON.stringify({ createdAt: new Date().toISOString(), id: -1 }),
    ).toString('base64url');
    expect(() => decodeCursor(bad)).toThrow(BadRequestException);
  });

  it('throws BadRequestException for non-integer id', () => {
    const bad = Buffer.from(
      JSON.stringify({ createdAt: new Date().toISOString(), id: 1.5 }),
    ).toString('base64url');
    expect(() => decodeCursor(bad)).toThrow(BadRequestException);
  });

  it('throws BadRequestException for invalid date string', () => {
    const bad = Buffer.from(
      JSON.stringify({ createdAt: 'not-a-date', id: 1 }),
    ).toString('base64url');
    expect(() => decodeCursor(bad)).toThrow(BadRequestException);
  });
});

// ---------------------------------------------------------------------------
// buildKeysetWhere
// ---------------------------------------------------------------------------

describe('buildKeysetWhere', () => {
  it('returns undefined when no cursor provided (first page)', () => {
    expect(buildKeysetWhere(undefined)).toBeUndefined();
    expect(buildKeysetWhere('')).toBeUndefined();
  });

  it('returns a valid OR clause for a valid cursor', () => {
    const date = new Date('2024-06-01T00:00:00.000Z');
    const cursor = encodeCursor(date, 10);
    const where = buildKeysetWhere(cursor);
    expect(where).toBeDefined();
    expect(where!.OR).toHaveLength(2);
    expect(where!.OR[0]).toEqual({ createdAt: { lt: date } });
    expect(where!.OR[1]).toEqual({ createdAt: { equals: date }, id: { lt: 10 } });
  });

  it('propagates BadRequestException for invalid cursor', () => {
    expect(() => buildKeysetWhere('garbage')).toThrow(BadRequestException);
  });
});

// ---------------------------------------------------------------------------
// buildNextCursor — first / middle / last page
// ---------------------------------------------------------------------------

describe('buildNextCursor', () => {
  it('first page: returns cursor pointing at last item when more pages exist', () => {
    // Page 1: items[0..1], limit=2, total=5
    const page = ITEMS.slice(0, 2);
    const cursor = buildNextCursor(page, 2, 5);
    expect(cursor).not.toBeNull();
    const decoded = decodeCursor(cursor!);
    expect(decoded.id).toBe(page[1].id);
    expect(new Date(decoded.createdAt).toISOString()).toBe(page[1].createdAt.toISOString());
  });

  it('middle page: returns cursor when items remain', () => {
    // Page 2: items[2..3], limit=2, total=5
    const page = ITEMS.slice(2, 4);
    const cursor = buildNextCursor(page, 2, 5);
    expect(cursor).not.toBeNull();
    const decoded = decodeCursor(cursor!);
    expect(decoded.id).toBe(page[1].id);
  });

  it('last page: returns null when fewer items than limit returned', () => {
    // Page 3: items[4], limit=2, total=5
    const page = ITEMS.slice(4);
    const cursor = buildNextCursor(page, 2, 5);
    expect(cursor).toBeNull();
  });

  it('last page: returns null when total <= limit', () => {
    const page = ITEMS.slice(0, 3);
    const cursor = buildNextCursor(page, 20, 3);
    expect(cursor).toBeNull();
  });

  it('empty page: returns null', () => {
    expect(buildNextCursor([], 20, 0)).toBeNull();
  });

  it('stable ordering: cursor from page 1 decodes to the correct boundary', () => {
    // Simulate fetching page 1 then verifying the cursor decodes to item[1]
    const limit = 2;
    const page1 = ITEMS.slice(0, limit);
    const cursor = buildNextCursor(page1, limit, ITEMS.length);
    expect(cursor).not.toBeNull();

    const { id, createdAt } = decodeCursor(cursor!);
    // The WHERE clause for page 2 must exclude item[1] and everything newer
    const where = buildKeysetWhere(cursor!);
    expect(where).toBeDefined();

    // Manually apply the WHERE to ITEMS to simulate what Prisma would return
    const ts = new Date(createdAt);
    const page2 = ITEMS.filter(
      (item) =>
        item.createdAt < ts ||
        (item.createdAt.getTime() === ts.getTime() && item.id < id),
    ).slice(0, limit);

    expect(page2).toHaveLength(2);
    expect(page2[0].id).toBe(ITEMS[2].id);
    expect(page2[1].id).toBe(ITEMS[3].id);
  });
});
