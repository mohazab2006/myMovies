import { NextRequest, NextResponse } from 'next/server';
import { searchMovies, searchByPerson, getGenres, TMDBMovie } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  try {
    // Check for API key
    if (!process.env.TMDB_API_KEY) {
      return NextResponse.json(
        { error: 'TMDB_API_KEY is not configured. Please set it in your .env.local file.' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'title'; // title, actor, keyword
    const page = parseInt(searchParams.get('page') || '1');
    const genre = searchParams.get('genre');
    const minRating = searchParams.get('minRating');
    const year = searchParams.get('year');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    let results: TMDBMovie[] = [];

    // Search based on type
    if (type === 'actor') {
      const response = await searchByPerson(query, page);
      results = response.results;
    } else {
      // Default to title/keyword search
      const response = await searchMovies(query, page);
      results = response.results;
    }

    // Apply filters
    if (genre) {
      const genreList = await getGenres();
      const genreMap = new Map(genreList.map(g => [g.name.toLowerCase(), g.id]));
      const genreId = genreMap.get(genre.toLowerCase());
      
      if (genreId) {
        results = results.filter(movie => 
          movie.genres?.some(g => g.id === genreId)
        );
      }
    }

    if (minRating) {
      const rating = parseFloat(minRating);
      results = results.filter(movie => movie.vote_average >= rating);
    }

    if (year) {
      const yearNum = parseInt(year);
      results = results.filter(movie => {
        const movieYear = movie.release_date?.split('-')[0];
        return movieYear === year.toString();
      });
    }

    return NextResponse.json({
      results,
      page,
      total_results: results.length,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}

