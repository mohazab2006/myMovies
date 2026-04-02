/**
 * Tests for lib/tmdb.ts
 * - Pure utility functions (getPosterUrl, getBackdropUrl)
 * - getKeywordIds: mocks fetch to test keyword lookup logic
 */

import { getPosterUrl, getBackdropUrl, getKeywordIds } from '@/lib/tmdb';

// ---------------------------------------------------------------------------
// getPosterUrl
// ---------------------------------------------------------------------------

describe('getPosterUrl', () => {
  it('returns a data URI placeholder when path is null', () => {
    expect(getPosterUrl(null)).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it('constructs a full TMDB w500 URL when path is provided', () => {
    expect(getPosterUrl('/abc123.jpg')).toBe('https://image.tmdb.org/t/p/w500/abc123.jpg');
  });

  it('returns a placeholder when path is empty string', () => {
    expect(getPosterUrl('')).toMatch(/^data:image\/svg\+xml;base64,/);
  });
});

// ---------------------------------------------------------------------------
// getBackdropUrl
// ---------------------------------------------------------------------------

describe('getBackdropUrl', () => {
  it('returns a data URI placeholder when path is null', () => {
    expect(getBackdropUrl(null)).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it('constructs a full TMDB w1280 URL when path is provided', () => {
    expect(getBackdropUrl('/backdrop.jpg')).toBe('https://image.tmdb.org/t/p/w1280/backdrop.jpg');
  });
});

// ---------------------------------------------------------------------------
// getKeywordIds
// ---------------------------------------------------------------------------

describe('getKeywordIds', () => {
  let fetchSpy: jest.SpyInstance;

  beforeAll(() => {
    process.env.TMDB_API_KEY = 'test-tmdb-key';
  });

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('returns an empty array when terms list is empty', async () => {
    const result = await getKeywordIds([]);
    expect(result).toEqual([]);
  });

  it('returns keyword IDs found by TMDB for given terms', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ id: 1756, name: 'desert' }, { id: 9009, name: 'desert storm' }] }),
    } as any);

    const result = await getKeywordIds(['desert']);
    expect(result).toContain(1756);
    expect(result).toContain(9009);
  });

  it('searches each term separately and combines unique IDs', async () => {
    let callCount = 0;
    fetchSpy.mockImplementation(() => {
      callCount++;
      const id = callCount === 1 ? 1756 : 9799;
      return Promise.resolve({
        ok: true,
        json: async () => ({ results: [{ id, name: 'term' }] }),
      } as any);
    });

    const result = await getKeywordIds(['desert', 'prophecy']);
    expect(result).toContain(1756);
    expect(result).toContain(9799);
    expect(new Set(result).size).toBe(result.length); // no duplicates
  });

  it('deduplicates IDs returned across multiple terms', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ id: 1756, name: 'desert' }] }),
    } as any);

    const result = await getKeywordIds(['desert', 'sand']);
    expect(result.filter(id => id === 1756)).toHaveLength(1);
  });

  it('gracefully skips terms where TMDB returns a non-ok response', async () => {
    fetchSpy
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 9799, name: 'prophecy' }] }),
      } as any);

    const result = await getKeywordIds(['bad-term', 'prophecy']);
    expect(result).not.toContain(undefined);
    expect(result).toContain(9799);
  });

  it('limits to 5 terms even if more are provided', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    } as any);

    await getKeywordIds(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    expect(fetchSpy).toHaveBeenCalledTimes(5);
  });
});
