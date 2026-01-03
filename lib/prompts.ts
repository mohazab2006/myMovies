// Centralized prompt templates for consistency

export const PREFERENCE_EXTRACTION_PROMPT = (userInput: string) => `You are a movie recommendation assistant. Convert the user's movie preferences into structured JSON.

User input: "${userInput}"

Extract the following information:
- genres: Array of genre names (e.g., ["thriller", "mystery", "drama"])
- avoid: Array of genres or themes to avoid (e.g., ["horror", "gore"])
- runtime_max: Maximum runtime in minutes (if mentioned)
- runtime_min: Minimum runtime in minutes (if mentioned)
- tone: The overall tone or vibe (e.g., "smart", "lighthearted", "dark", "uplifting")
- era: Time period preference (e.g., "2000+", "1990s", "classic")
- vote_average.gte: Minimum rating (0-10, if mentioned)
- primary_release_date.gte: Earliest year (format: "YYYY-01-01")
- primary_release_date.lte: Latest year (format: "YYYY-12-31")

Return ONLY valid JSON, no markdown, no explanation. If a field is not mentioned, omit it.`;

export const RANKING_PROMPT = (
  candidates: string,
  userPreferences?: string
) => `You are a movie recommendation assistant. Rank the following movies based on the user's preferences and select the top 5-10 best matches.

${userPreferences ? `User preferences: ${userPreferences}\n\n` : ''}Candidate movies:
${candidates}

Your task:
1. Select the top 5-10 movies that best match the user's preferences
2. Rank them from best match (rank 1) to least match
3. Provide a 1-2 sentence explanation for why each movie is a good match

Return ONLY valid JSON array, no markdown, no explanation.`;



