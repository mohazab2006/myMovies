const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  poster_path: string | null;
  backdrop_path: string | null;
  runtime?: number;
  genre_ids?: number[]; // From discover/search API
  genres?: { id: number; name: string }[]; // From detailed movie API
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
  };
}

export interface TMDBDiscoverResponse {
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDBSearchResponse {
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export function getPosterUrl(path: string | null): string {
  if (!path) {
    // Return a simple data URI placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjI1MCIgeT0iMzc1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPk5vIFBvc3RlciBBdmFpbGFibGU8L3RleHQ+PC9zdmc+';
  }
  return `${TMDB_IMAGE_BASE}${path}`;
}

export function getBackdropUrl(path: string | null): string {
  if (!path) {
    // Return a simple data URI placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4MCIgaGVpZ2h0PSI3MjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyODAiIGhlaWdodD0iNzIwIiBmaWxsPSIjMWYyOTM3Ii8+PHRleHQgeD0iNjQwIiB5PSIzNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Tm8gQmFja2Ryb3AgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
  }
  return `https://image.tmdb.org/t/p/w1280${path}`;
}

export async function discoverMovies(params: {
  genres?: string;
  with_genres?: string;
  'vote_average.gte'?: number;
  'primary_release_date.gte'?: string;
  'primary_release_date.lte'?: string;
  'with_runtime.lte'?: number;
  sort_by?: string;
  page?: number;
}): Promise<TMDBDiscoverResponse> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not set');
  }

  const queryParams = new URLSearchParams({
    api_key: apiKey,
    ...Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined)
    ),
  });

  const response = await fetch(
    `${TMDB_BASE_URL}/discover/movie?${queryParams}`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  return response.json();
}

export async function searchMovies(query: string, page: number = 1): Promise<TMDBSearchResponse> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not set');
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  return response.json();
}

export async function searchByPerson(query: string, page: number = 1): Promise<TMDBSearchResponse> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not set');
  }

  // First search for the person
  const personResponse = await fetch(
    `${TMDB_BASE_URL}/search/person?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}`
  );

  if (!personResponse.ok) {
    throw new Error(`TMDB API error: ${personResponse.statusText}`);
  }

  const personData = await personResponse.json();
  if (personData.results.length === 0) {
    return { results: [], total_pages: 0, total_results: 0 };
  }

  // Get movies for the first person found
  const personId = personData.results[0].id;
  const moviesResponse = await fetch(
    `${TMDB_BASE_URL}/person/${personId}/movie_credits?api_key=${apiKey}`
  );

  if (!moviesResponse.ok) {
    throw new Error(`TMDB API error: ${moviesResponse.statusText}`);
  }

  const moviesData = await moviesResponse.json();
  return {
    results: moviesData.cast || [],
    total_pages: 1,
    total_results: (moviesData.cast || []).length,
  };
}

export async function getMovieDetails(id: number): Promise<TMDBMovie> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not set');
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${id}?api_key=${apiKey}&append_to_response=credits`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Movie with ID ${id} not found`);
    }
    throw new Error(`TMDB API error: ${response.statusText} (Movie ID: ${id})`);
  }

  return response.json();
}

export async function getTrendingMovies(
  timeWindow: 'day' | 'week' = 'week',
  page: number = 1
): Promise<TMDBDiscoverResponse> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not set');
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/trending/movie/${timeWindow}?api_key=${apiKey}&page=${page}`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getGenres(): Promise<Array<{ id: number; name: string }>> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not set');
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/genre/movie/list?api_key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.genres || [];
}

