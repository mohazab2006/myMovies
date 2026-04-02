/**
 * Tests for lib/tmdb.ts — pure utility functions (no API calls needed)
 */

import { getPosterUrl, getBackdropUrl } from '@/lib/tmdb';

describe('getPosterUrl', () => {
  it('returns a data URI placeholder when path is null', () => {
    const url = getPosterUrl(null);
    expect(url).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it('constructs a full TMDB image URL when path is provided', () => {
    const url = getPosterUrl('/abc123.jpg');
    expect(url).toBe('https://image.tmdb.org/t/p/w500/abc123.jpg');
  });

  it('returns a data URI placeholder when path is empty string', () => {
    // empty string is falsy — should return placeholder
    const url = getPosterUrl('');
    expect(url).toMatch(/^data:image\/svg\+xml;base64,/);
  });
});

describe('getBackdropUrl', () => {
  it('returns a data URI placeholder when path is null', () => {
    const url = getBackdropUrl(null);
    expect(url).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it('constructs a full TMDB w1280 URL when path is provided', () => {
    const url = getBackdropUrl('/backdrop.jpg');
    expect(url).toBe('https://image.tmdb.org/t/p/w1280/backdrop.jpg');
  });
});
