/**
 * Tests for lib/openai.ts
 *
 * Covers JSON parsing paths in extractPreferences and rankMovies,
 * the keyword extraction feature, and the "always return results" behaviour.
 */

const mockCreate = jest.fn();

jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }))
);

import { extractPreferences, rankMovies, broadenSearch } from '@/lib/openai';

beforeAll(() => {
  process.env.OPENAI_API_KEY = 'test-key';
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOpenAIResponse(content: string | null) {
  return { choices: [{ message: { content } }] };
}

// ---------------------------------------------------------------------------
// extractPreferences
// ---------------------------------------------------------------------------

describe('extractPreferences', () => {
  it('parses valid JSON preferences returned by the model', async () => {
    const payload = {
      genres: ['adventure', 'fantasy'],
      tone: 'epic',
      'vote_average.gte': 7,
    };
    mockCreate.mockResolvedValue(makeOpenAIResponse(JSON.stringify(payload)));

    const result = await extractPreferences('desert prophecy movie');
    expect(result).toEqual(payload);
  });

  it('includes extracted keywords in the response', async () => {
    const payload = {
      genres: ['adventure', 'fantasy'],
      keywords: ['desert', 'prophecy', 'chosen one'],
      tone: 'epic',
    };
    mockCreate.mockResolvedValue(makeOpenAIResponse(JSON.stringify(payload)));

    const result = await extractPreferences('movie set in the desert with a prophecy');
    expect(result.keywords).toEqual(['desert', 'prophecy', 'chosen one']);
  });

  it('works without keywords field for simple genre queries', async () => {
    const payload = { genres: ['comedy'] };
    mockCreate.mockResolvedValue(makeOpenAIResponse(JSON.stringify(payload)));

    const result = await extractPreferences('funny movie');
    expect(result.genres).toEqual(['comedy']);
    expect(result.keywords).toBeUndefined();
  });

  it('throws "No response from OpenAI" when content is null', async () => {
    mockCreate.mockResolvedValue(makeOpenAIResponse(null));
    await expect(extractPreferences('anything')).rejects.toThrow('No response from OpenAI');
  });

  it('throws "Invalid JSON response from AI" when content is not valid JSON', async () => {
    mockCreate.mockResolvedValue(makeOpenAIResponse('this is not json'));
    await expect(extractPreferences('anything')).rejects.toThrow('Invalid JSON response from AI');
  });

  it('returns an empty object when the model returns an empty JSON object', async () => {
    mockCreate.mockResolvedValue(makeOpenAIResponse('{}'));
    const result = await extractPreferences('no preferences');
    expect(result).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// rankMovies
// ---------------------------------------------------------------------------

const sampleCandidates = [
  { id: 438631, title: 'Dune', year: '2021', rating: 7.8, overview: 'Paul Atreides leads nomadic tribes in the desert.', genres: ['adventure', 'fantasy'] },
  { id: 693134, title: 'Dune: Part Two', year: '2024', rating: 8.2, overview: "Paul fulfills the desert prophecy.", genres: ['adventure', 'fantasy'] },
  { id: 11, title: 'Star Wars', year: '1977', rating: 8.6, overview: 'A long time ago in a galaxy far away.', genres: ['science fiction', 'adventure'] },
];

describe('rankMovies', () => {
  describe('JSON response format handling', () => {
    it('handles { results: [...] } format (primary format)', async () => {
      const payload = {
        results: [
          { id: 438631, rank: 1, reason: 'Desert prophecy classic.' },
          { id: 693134, rank: 2, reason: 'Epic continuation.' },
        ],
      };
      mockCreate.mockResolvedValue(makeOpenAIResponse(JSON.stringify(payload)));

      const result = await rankMovies(sampleCandidates, 'desert prophecy');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 438631, rank: 1, reason: 'Desert prophecy classic.' });
    });

    it('handles { movies: [...] } format', async () => {
      const payload = { movies: [{ id: 438631, rank: 1, reason: 'Great desert film.' }] };
      mockCreate.mockResolvedValue(makeOpenAIResponse(JSON.stringify(payload)));

      const result = await rankMovies(sampleCandidates, 'desert');
      expect(result[0].id).toBe(438631);
    });

    it('handles bare array format (fallback)', async () => {
      mockCreate.mockResolvedValue(makeOpenAIResponse(JSON.stringify([{ id: 438631, rank: 1, reason: 'Top pick.' }])));

      const result = await rankMovies(sampleCandidates, 'desert');
      expect(result[0].id).toBe(438631);
    });

    it('handles any other array key via generic fallback', async () => {
      const payload = { ranked_movies: [{ id: 693134, rank: 1, reason: 'Best match.' }] };
      mockCreate.mockResolvedValue(makeOpenAIResponse(JSON.stringify(payload)));

      const result = await rankMovies(sampleCandidates, 'desert');
      expect(result[0].id).toBe(693134);
    });
  });

  describe('field defaults', () => {
    it('fills in rank from index when rank field is missing', async () => {
      const payload = { results: [{ id: 438631, reason: 'No rank.' }, { id: 693134, reason: 'Also no rank.' }] };
      mockCreate.mockResolvedValue(makeOpenAIResponse(JSON.stringify(payload)));

      const result = await rankMovies(sampleCandidates);
      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
    });

    it('uses "explanation" field as fallback for reason', async () => {
      const payload = { results: [{ id: 438631, rank: 1, explanation: 'Uses explanation field.' }] };
      mockCreate.mockResolvedValue(makeOpenAIResponse(JSON.stringify(payload)));

      const result = await rankMovies(sampleCandidates);
      expect(result[0].reason).toBe('Uses explanation field.');
    });

    it('provides default reason when neither reason nor explanation present', async () => {
      const payload = { results: [{ id: 438631, rank: 1 }] };
      mockCreate.mockResolvedValue(makeOpenAIResponse(JSON.stringify(payload)));

      const result = await rankMovies(sampleCandidates);
      expect(result[0].reason).toBe('A great match for your preferences.');
    });
  });

  describe('"always return results" behaviour', () => {
    it('returns closest matches even when query is unusual', async () => {
      const payload = {
        results: [
          { id: 11, rank: 1, reason: 'Closest match available for your unusual request.' },
          { id: 438631, rank: 2, reason: 'Also somewhat related.' },
        ],
      };
      mockCreate.mockResolvedValue(makeOpenAIResponse(JSON.stringify(payload)));

      const result = await rankMovies(sampleCandidates, 'aliens teaching penguins to cook pasta');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].reason).toContain('Closest match');
    });
  });
});

// ---------------------------------------------------------------------------
// broadenSearch
// ---------------------------------------------------------------------------

describe('broadenSearch', () => {
  it('returns broader genres and keywords from GPT', async () => {
    const payload = {
      genres: ['drama', 'history'],
      keywords: ['epic', 'mythology', 'ancient civilization'],
    };
    mockCreate.mockResolvedValue(makeOpenAIResponse(JSON.stringify(payload)));

    const result = await broadenSearch('desert prophecy movie', ['adventure'], ['desert', 'prophecy']);
    expect(result.genres).toEqual(['drama', 'history']);
    expect(result.keywords).toEqual(['epic', 'mythology', 'ancient civilization']);
  });

  it('returns empty arrays when GPT returns no content', async () => {
    mockCreate.mockResolvedValue(makeOpenAIResponse(null));

    const result = await broadenSearch('weird query', [], []);
    expect(result).toEqual({ genres: [], keywords: [] });
  });

  it('returns empty arrays when GPT returns invalid JSON', async () => {
    mockCreate.mockResolvedValue(makeOpenAIResponse('not json'));

    const result = await broadenSearch('weird query', [], []);
    expect(result).toEqual({ genres: [], keywords: [] });
  });

  it('handles missing genres key gracefully', async () => {
    mockCreate.mockResolvedValue(makeOpenAIResponse(JSON.stringify({ keywords: ['epic'] })));

    const result = await broadenSearch('query', [], []);
    expect(result.genres).toEqual([]);
    expect(result.keywords).toEqual(['epic']);
  });

  it('handles missing keywords key gracefully', async () => {
    mockCreate.mockResolvedValue(makeOpenAIResponse(JSON.stringify({ genres: ['action'] })));

    const result = await broadenSearch('query', [], []);
    expect(result.genres).toEqual(['action']);
    expect(result.keywords).toEqual([]);
  });

  describe('error cases', () => {
    it('throws "Invalid JSON response from AI" when content is not valid JSON', async () => {
      mockCreate.mockResolvedValue(makeOpenAIResponse('not valid json {{'));
      await expect(rankMovies(sampleCandidates, 'desert')).rejects.toThrow('Invalid JSON response from AI');
    });

    it('throws "No response from OpenAI" when content is null', async () => {
      mockCreate.mockResolvedValue(makeOpenAIResponse(null));
      await expect(rankMovies(sampleCandidates)).rejects.toThrow('No response from OpenAI');
    });

    it('throws "No movies found matching your preferences" for empty results array', async () => {
      mockCreate.mockResolvedValue(makeOpenAIResponse(JSON.stringify({ results: [] })));
      await expect(rankMovies(sampleCandidates, 'obscure query')).rejects.toThrow(
        'No movies found matching your preferences'
      );
    });

    it('throws "No movies found" when object has no array values', async () => {
      mockCreate.mockResolvedValue(makeOpenAIResponse(JSON.stringify({ message: 'no matches' })));
      await expect(rankMovies(sampleCandidates, 'nothing')).rejects.toThrow(
        'No movies found matching your preferences'
      );
    });
  });
});
