import { NextRequest, NextResponse } from 'next/server';
import { extractPreferences, rankMovies } from '@/lib/openai';
import { discoverMovies, getMovieDetails, getGenres, getKeywordIds, searchMovies, TMDBMovie } from '@/lib/tmdb';

export async function POST(request: NextRequest) {
  try {
    // Check for API keys
    if (!process.env.TMDB_API_KEY) {
      return NextResponse.json(
        { error: 'TMDB_API_KEY is not configured. Please set it in your .env.local file.' },
        { status: 500 }
      );
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured. Please set it in your .env.local file.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      prompt,
      genres = [],
      minRating,
      runtimeLimit,
      yearFrom,
      yearTo,
    } = body;

    // Step 1: Extract structured preferences from user input
    let preferences: any = {};
    
    if (prompt) {
      try {
        preferences = await extractPreferences(prompt);
      } catch (error) {
        console.error('Preference extraction failed:', error);
        // Fallback to manual extraction
      }
    }

    // Override with explicit filters if provided
    if (genres.length > 0) {
      preferences.genres = genres;
    }
    if (minRating) {
      preferences['vote_average.gte'] = minRating;
    }
    if (runtimeLimit) {
      preferences['with_runtime.lte'] = runtimeLimit;
    }
    if (yearFrom) {
      preferences['primary_release_date.gte'] = `${yearFrom}-01-01`;
    }
    if (yearTo) {
      preferences['primary_release_date.lte'] = `${yearTo}-12-31`;
    }

    // Step 2: Resolve genre IDs and keyword IDs in parallel
    const [genreList, keywordIds] = await Promise.all([
      getGenres(),
      preferences.keywords?.length > 0
        ? getKeywordIds(preferences.keywords)
        : Promise.resolve([] as number[]),
    ]);

    const genreMap = new Map(genreList.map(g => [g.name.toLowerCase(), g.id]));
    const genreIdToName = new Map(genreList.map(g => [g.id, g.name.toLowerCase()]));

    // Convert genre names to IDs
    let requestedGenreIds: number[] = [];
    if (preferences.genres && Array.isArray(preferences.genres)) {
      requestedGenreIds = preferences.genres
        .map((g: string) => genreMap.get(g.toLowerCase()))
        .filter((id: number | undefined): id is number => id !== undefined);
    }

    // Build clean TMDB discover params (only fields TMDB understands)
    const tmdbBase: Record<string, any> = {};
    if (requestedGenreIds.length > 0) tmdbBase.with_genres = requestedGenreIds.join(',');
    if (preferences['vote_average.gte']) tmdbBase['vote_average.gte'] = preferences['vote_average.gte'];
    if (preferences['primary_release_date.gte']) tmdbBase['primary_release_date.gte'] = preferences['primary_release_date.gte'];
    if (preferences['primary_release_date.lte']) tmdbBase['primary_release_date.lte'] = preferences['primary_release_date.lte'];
    if (preferences['with_runtime.lte']) tmdbBase['with_runtime.lte'] = preferences['with_runtime.lte'];

    // Step 3: Multi-strategy candidate discovery — never returns empty
    const seen = new Set<number>();
    const candidates: TMDBMovie[] = [];

    const addMovies = (movies: TMDBMovie[]) => {
      for (const m of movies) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          candidates.push(m);
        }
      }
    };

    // Strategy 1 (parallel): genre-based discover + keyword-based discover
    const discoveryJobs: Promise<TMDBMovie[]>[] = [];

    // Genre discover — up to 3 pages
    discoveryJobs.push((async () => {
      const movies: TMDBMovie[] = [];
      for (let page = 1; page <= 3; page++) {
        try {
          const res = await discoverMovies({ ...tmdbBase, sort_by: 'popularity.desc', page });
          movies.push(...res.results);
          if (page >= res.total_pages) break;
        } catch { break; }
      }
      return movies;
    })());

    // Keyword discover — uses OR logic across all keyword IDs, 2 pages
    if (keywordIds.length > 0) {
      discoveryJobs.push((async () => {
        const movies: TMDBMovie[] = [];
        const kwParams = { ...tmdbBase, with_keywords: keywordIds.join('|'), sort_by: 'popularity.desc' };
        for (let page = 1; page <= 2; page++) {
          try {
            const res = await discoverMovies({ ...kwParams, page });
            movies.push(...res.results);
            if (page >= res.total_pages) break;
          } catch { break; }
        }
        return movies;
      })());
    }

    const strategyOneResults = await Promise.allSettled(discoveryJobs);
    for (const r of strategyOneResults) {
      if (r.status === 'fulfilled') addMovies(r.value);
    }

    // Strategy 2: TMDB text search with the original prompt
    if (candidates.length < 20 && prompt) {
      try {
        const searchRes = await searchMovies(prompt);
        addMovies(searchRes.results);
      } catch { /* ignore */ }
    }

    // Strategy 3: keyword text searches (individual terms)
    if (candidates.length < 20 && preferences.keywords?.length > 0) {
      await Promise.allSettled(
        (preferences.keywords as string[]).slice(0, 3).map(async (kw: string) => {
          try {
            const res = await searchMovies(kw);
            addMovies(res.results);
          } catch { /* ignore */ }
        })
      );
    }

    // Strategy 4: popular movies safety net — guarantees we always have candidates
    if (candidates.length < 5) {
      try {
        const popular = await discoverMovies({ sort_by: 'popularity.desc', page: 1 });
        addMovies(popular.results);
      } catch { /* ignore */ }
    }

    // Step 4: Prepare candidate data for AI ranking
    const candidateData = candidates.slice(0, 200).map(movie => {
      const movieGenreIds = (movie as any).genre_ids || [];
      const movieGenres = movieGenreIds
        .map((id: number) => genreIdToName.get(id))
        .filter((name: string | undefined): name is string => name !== undefined);

      return {
        id: movie.id,
        title: movie.title,
        year: movie.release_date?.split('-')[0] || 'Unknown',
        rating: movie.vote_average,
        overview: movie.overview || '',
        genres: movieGenres,
      };
    });

    // Step 5: AI ranking
    const ranked = await rankMovies(candidateData, prompt || JSON.stringify(preferences));

    // Step 6: Fetch full details for top-ranked movies
    const topMovies = ranked.slice(0, 10);
    
    // Use Promise.allSettled to handle individual failures gracefully
    const movieDetailsResults = await Promise.allSettled(
      topMovies.map(({ id }) => getMovieDetails(id))
    );

    // Filter out failed fetches and combine with AI explanations
    const results = movieDetailsResults
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          const ranking = topMovies[index];
          return {
            ...result.value,
            aiExplanation: ranking.reason,
            rank: ranking.rank,
          };
        } else {
          // Log the error but don't fail the entire request
          console.warn(`Failed to fetch movie ${topMovies[index].id}:`, result.reason);
          return null;
        }
      })
      .filter((movie): movie is any => movie !== null);

    // If we have no results, return an error
    if (results.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch movie details. Some movies may no longer be available.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

