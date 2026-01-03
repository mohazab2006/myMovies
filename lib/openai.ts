import OpenAI from 'openai';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  return new OpenAI({
    apiKey,
  });
}

export interface StructuredPreferences {
  genres?: string[];
  avoid?: string[];
  runtime_max?: number;
  runtime_min?: number;
  tone?: string;
  era?: string;
  'vote_average.gte'?: number;
  'primary_release_date.gte'?: string;
  'primary_release_date.lte'?: string;
}

export interface RankedMovie {
  id: number;
  reason: string;
  rank: number;
}

export async function extractPreferences(
  userInput: string
): Promise<StructuredPreferences> {
  const openai = getOpenAIClient();
  const prompt = `You are a movie recommendation assistant. Convert the user's movie preferences into structured JSON.

User input: "${userInput}"

IMPORTANT: Map common words to standard genre names:
- "funny", "funny movie", "comedy", "comedic", "humor", "humorous" → "comedy"
- "scary", "horror", "frightening", "spooky" → "horror"
- "action", "action-packed", "explosive" → "action"
- "romantic", "romance", "love story" → "romance"
- "thriller", "suspenseful", "tense" → "thriller"
- "drama", "dramatic" → "drama"
- "sci-fi", "science fiction", "futuristic" → "science fiction"
- "fantasy", "magical" → "fantasy"
- "animated", "cartoon", "animation" → "animation"

Extract the following information:
- genres: Array of standard TMDB genre names (e.g., ["comedy", "thriller", "mystery", "drama", "action", "romance", "horror", "science fiction", "fantasy", "animation"])
- avoid: Array of genres or themes to avoid (e.g., ["horror", "gore"])
- runtime_max: Maximum runtime in minutes (if mentioned)
- runtime_min: Minimum runtime in minutes (if mentioned)
- tone: The overall tone or vibe (e.g., "smart", "lighthearted", "dark", "uplifting")
- era: Time period preference (e.g., "2000+", "1990s", "classic")
- vote_average.gte: Minimum rating (0-10, if mentioned)
- primary_release_date.gte: Earliest year (format: "YYYY-01-01")
- primary_release_date.lte: Latest year (format: "YYYY-12-31")

Return ONLY valid JSON, no markdown, no explanation. If a field is not mentioned, omit it.

Example output:
{
  "genres": ["comedy"],
  "avoid": ["horror"],
  "runtime_max": 120,
  "tone": "lighthearted",
  "era": "2000+",
  "vote_average.gte": 7.0,
  "primary_release_date.gte": "2000-01-01"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant that extracts structured movie preferences from user input. Always return valid JSON only, no markdown formatting.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    return JSON.parse(content) as StructuredPreferences;
  } catch (error) {
    console.error('Failed to parse preferences:', content);
    throw new Error('Invalid JSON response from AI');
  }
}

export async function rankMovies(
  candidates: Array<{
    id: number;
    title: string;
    year: string;
    rating: number;
    overview: string;
    genres?: string[];
  }>,
  userPreferences?: string
): Promise<RankedMovie[]> {
  const openai = getOpenAIClient();
  const candidatesText = candidates
    .map(
      (m) =>
        `ID: ${m.id}, Title: ${m.title} (${m.year}), Rating: ${m.rating}/10, Genres: ${(m.genres || []).join(', ') || 'N/A'}, Overview: ${m.overview}`
    )
    .join('\n');

  const prompt = `You are a movie recommendation assistant. Rank the following movies based on the user's preferences and select the top 5-10 best matches.

${userPreferences ? `User preferences: ${userPreferences}\n\n` : ''}Candidate movies:
${candidatesText}

CRITICAL RULES:
1. If the user requested a specific genre (e.g., "comedy", "funny movie"), ONLY select movies that match that genre. Do NOT include movies from other genres.
2. If the user said "funny" or "comedy", ONLY select comedy movies. Exclude action, drama, thriller, horror, etc.
3. If the user said "action", ONLY select action movies.
4. Strictly filter by genre match first, then rank by quality and relevance.
5. If no movies match the genre requirement, return an empty array.

Your task:
1. Filter movies to ONLY include those matching the user's genre preferences
2. Select the top 5-10 movies that best match ALL user preferences
3. Rank them from best match (rank 1) to least match
4. Provide a 1-2 sentence explanation for why each movie is a good match

Return ONLY valid JSON array, no markdown, no explanation. Format:
[
  {
    "id": 12345,
    "rank": 1,
    "reason": "A tense mystery with layered characters and a strong final twist."
  },
  {
    "id": 67890,
    "rank": 2,
    "reason": "Smart dialogue and compelling character development."
  }
]`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful movie recommendation assistant. Return a JSON object with a "results" array containing the ranked movies. Format: {"results": [{"id": 123, "rank": 1, "reason": "..."}]}',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  try {
    const parsed = JSON.parse(content);
    // Handle both { results: [...] } and [...] formats
    let results: any[] = [];
    if (Array.isArray(parsed)) {
      results = parsed;
    } else if (parsed.results && Array.isArray(parsed.results)) {
      results = parsed.results;
    } else if (parsed.movies && Array.isArray(parsed.movies)) {
      results = parsed.movies;
    } else {
      // Try to find any array in the response
      const keys = Object.keys(parsed);
      for (const key of keys) {
        if (Array.isArray(parsed[key])) {
          results = parsed[key];
          break;
        }
      }
    }
    
    if (results.length === 0) {
      throw new Error('No ranked movies in AI response');
    }
    
    return results.map((item: any, index: number) => ({
      id: item.id,
      rank: item.rank !== undefined ? item.rank : index + 1,
      reason: item.reason || item.explanation || 'A great match for your preferences.',
    }));
  } catch (error) {
    console.error('Failed to parse rankings:', content);
    throw new Error('Invalid JSON response from AI');
  }
}

export async function generateMovieExplanation(
  movie: {
    title: string;
    overview: string;
    genres: string[];
    rating: number;
  }
): Promise<string> {
  const openai = getOpenAIClient();
  const prompt = `Explain why someone might like this movie in 2-3 sentences. Be engaging and specific.

Movie: ${movie.title}
Overview: ${movie.overview}
Genres: ${movie.genres.join(', ')}
Rating: ${movie.rating}/10

Provide a brief, engaging explanation of why this movie is worth watching.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful movie recommendation assistant. Provide engaging, concise explanations.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 150,
  });

  return response.choices[0]?.message?.content || 'This movie offers an engaging story and compelling characters.';
}

