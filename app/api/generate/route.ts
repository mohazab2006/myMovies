import { NextRequest, NextResponse } from 'next/server';
import { extractPreferences, rankMovies } from '@/lib/openai';
import { discoverMovies, getMovieDetails, getGenres, TMDBMovie } from '@/lib/tmdb';

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

    // Step 2: Get genre IDs from TMDB
    const genreList = await getGenres();
    const genreMap = new Map(genreList.map(g => [g.name.toLowerCase(), g.id]));
    
    // Convert genre names to IDs
    if (preferences.genres && Array.isArray(preferences.genres)) {
      const genreIds = preferences.genres
        .map((g: string) => genreMap.get(g.toLowerCase()))
        .filter((id: number | undefined): id is number => id !== undefined);
      
      if (genreIds.length > 0) {
        preferences.with_genres = genreIds.join(',');
        delete preferences.genres;
      }
    }
    
    // Store requested genre IDs for later filtering
    const requestedGenreIds = preferences.with_genres 
      ? preferences.with_genres.split(',').map((id: string) => parseInt(id))
      : [];

    // Step 3: Fetch candidate movies from TMDB (batch retrieval)
    const candidates: TMDBMovie[] = [];
    const maxPages = 3; // Fetch up to 3 pages (60 movies per page = 180 max)
    
    for (let page = 1; page <= maxPages; page++) {
      const discoverParams = {
        ...preferences,
        sort_by: 'popularity.desc',
        page,
      };
      
      const response = await discoverMovies(discoverParams);
      candidates.push(...response.results);
      
      if (page >= response.total_pages) break;
    }

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: 'No movies found matching your criteria' },
        { status: 404 }
      );
    }

    // Step 4: Get genre names for filtering
    const genreIdToName = new Map(genreList.map(g => [g.id, g.name.toLowerCase()]));
    
    // Step 5: Prepare candidate data for AI ranking (include genre info)
    const candidateData = candidates.slice(0, 200)
      .map(movie => {
        // Get genre names from genre_ids (TMDB discover returns genre_ids, not full genre objects)
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
      })
      // Server-side filter: if specific genres were requested, only include movies with those genres
      .filter((movie, index) => {
        if (requestedGenreIds.length > 0) {
          const originalMovie = candidates[index];
          const movieGenreIds = originalMovie.genre_ids || [];
          // Check if movie has at least one of the requested genres
          return requestedGenreIds.some((requestedId: number) => movieGenreIds.includes(requestedId));
        }
        return true;
      });

    // Step 6: AI ranking
    const ranked = await rankMovies(candidateData, prompt || JSON.stringify(preferences));

    // Step 7: Fetch full details for top-ranked movies
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

