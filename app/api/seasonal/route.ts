import { NextRequest, NextResponse } from 'next/server';
import { discoverMovies, getGenres, searchMovies } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.TMDB_API_KEY) {
      return NextResponse.json(
        { error: 'TMDB_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const month = new Date().getMonth() + 1; // 1-12
    let genreId: number | null = null;
    let seasonName = '';
    let keyword: string | null = null;

    // Determine seasonal genre/keyword based on month
    const genreList = await getGenres();
    const genreMap = new Map(genreList.map(g => [g.name.toLowerCase(), g.id]));

    if (month === 12 || month === 1) {
      // December/January - Christmas movies
      // Use keyword search for better Christmas movie results
      keyword = 'Christmas';
      seasonName = 'Christmas';
      // Fallback to family genre if keyword search fails
      genreId = genreMap.get('family') || null;
    } else if (month === 10) {
      // October - Halloween/Horror
      keyword = 'Halloween';
      seasonName = 'Halloween';
      genreId = genreMap.get('horror') || null;
    } else if (month >= 6 && month <= 8) {
      // Summer - Action/Adventure
      seasonName = 'Summer';
      genreId = genreMap.get('action') || null;
    } else if (month >= 2 && month <= 4) {
      // Spring - Romance/Comedy
      seasonName = 'Spring';
      genreId = genreMap.get('romance') || null;
    }

    // If keyword is available (Christmas/Halloween), use keyword search
    if (keyword) {
      try {
        const searchResponse = await searchMovies(keyword, 1);
        // Filter to get better quality results (rating > 5)
        const filtered = searchResponse.results
          .filter(movie => movie.vote_average > 5)
          .slice(0, 20);
        
        if (filtered.length > 0) {
          return NextResponse.json({ 
            results: filtered,
            seasonName 
          });
        }
      } catch (error) {
        console.error('Keyword search failed, falling back to genre:', error);
      }
    }

    // If no specific season or keyword search failed, use popular movies
    if (!genreId) {
      const response = await discoverMovies({
        sort_by: 'popularity.desc',
        page: 1,
      });
      return NextResponse.json({ 
        results: response.results.slice(0, 20),
        seasonName: 'Popular'
      });
    }

    // Fetch seasonal movies by genre
    const response = await discoverMovies({
      with_genres: genreId.toString(),
      sort_by: 'popularity.desc',
      page: 1,
    });

    return NextResponse.json({ 
      results: response.results.slice(0, 20),
      seasonName 
    });
  } catch (error: any) {
    console.error('Seasonal movies error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch seasonal movies' },
      { status: 500 }
    );
  }
}

