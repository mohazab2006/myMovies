import { NextResponse } from 'next/server';
import { getGenres } from '@/lib/tmdb';

export async function GET() {
  try {
    // Check for API key
    if (!process.env.TMDB_API_KEY) {
      return NextResponse.json(
        { error: 'TMDB_API_KEY is not configured. Please set it in your .env.local file.' },
        { status: 500 }
      );
    }

    const genres = await getGenres();
    return NextResponse.json({ genres });
  } catch (error: any) {
    console.error('Genres error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch genres' },
      { status: 500 }
    );
  }
}

