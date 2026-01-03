import { NextRequest, NextResponse } from 'next/server';
import { getTrendingMovies } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.TMDB_API_KEY) {
      return NextResponse.json(
        { error: 'TMDB_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const timeWindow = searchParams.get('time_window') || 'week'; // day or week
    const page = parseInt(searchParams.get('page') || '1');

    const response = await getTrendingMovies(timeWindow as 'day' | 'week', page);
    
    return NextResponse.json({ results: response.results });
  } catch (error: any) {
    console.error('Trending movies error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trending movies' },
      { status: 500 }
    );
  }
}

