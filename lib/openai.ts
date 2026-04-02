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
  keywords?: string[];
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
- keywords: Array of specific themes, settings, objects, or story elements to search for (e.g., ["desert", "prophecy", "heist", "time travel", "robot", "christmas", "based on true story", "cooking", "space station"]). Be generous — extract anything specific and searchable from the input.
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
  "genres": ["adventure", "fantasy"],
  "keywords": ["desert", "prophecy", "chosen one", "sand"],
  "tone": "epic",
  "vote_average.gte": 7.0
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
1. ALWAYS return at least 5 movies — never return an empty results array. If no movie perfectly matches, return the closest ones available.
2. Prioritize movies that match the user's genre, theme, setting, or mood as closely as possible.
3. If no perfect match exists, pick the most thematically similar movies and explain why they are the closest match.
4. Rank by relevance to the user's request — best match first.
5. Never refuse to return results. Even for unusual or vague requests, always find the nearest matches.

Your task:
1. Select the top 5-10 movies that best match the user's preferences (or are the closest available)
2. Rank them from best match (rank 1) to least match
3. Provide a 1-2 sentence explanation for why each movie fits (or is the closest match to) what the user wants

Return a JSON object with a "results" array. No markdown, no explanation. Format:
{
  "results": [
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
  ]
}`;

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

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse AI ranking response as JSON:', content);
    throw new Error('Invalid JSON response from AI');
  }

  // Handle both { results: [...] }, { movies: [...] }, and bare array formats
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
    throw new Error('No movies found matching your preferences');
  }

  return results.map((item: any, index: number) => ({
    id: item.id,
    rank: item.rank !== undefined ? item.rank : index + 1,
    reason: item.reason || item.explanation || 'A great match for your preferences.',
  }));
}

export async function broadenSearch(
  userInput: string,
  usedGenres: string[],
  usedKeywords: string[]
): Promise<{ genres: string[]; keywords: string[] }> {
  const openai = getOpenAIClient();

  const prompt = `A user asked for movies matching: "${userInput}"

Initial search already used:
- Genres: ${usedGenres.length > 0 ? usedGenres.join(', ') : 'none'}
- Keywords: ${usedKeywords.length > 0 ? usedKeywords.join(', ') : 'none'}

That returned too few results. Suggest BROADER or ALTERNATIVE search terms to surface more relevant movies while staying true to what the user wants.

Think laterally:
- What other genres contain movies with a similar vibe or themes?
- What related keywords, settings, or story elements might appear in movies the user would enjoy?
- Do NOT repeat terms already used above.

Return ONLY valid JSON with two arrays. Example:
{
  "genres": ["drama", "history"],
  "keywords": ["epic", "mythology", "ancient civilization", "hero"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a movie search strategist. When a search returns too few results, suggest broader alternative genres and keywords. Always return valid JSON only.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return { genres: [], keywords: [] };
  }

  try {
    const parsed = JSON.parse(content);
    return {
      genres: Array.isArray(parsed.genres) ? parsed.genres : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    };
  } catch {
    return { genres: [], keywords: [] };
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

