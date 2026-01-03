import { NextRequest, NextResponse } from 'next/server';
import { getMovieDetails } from '@/lib/tmdb';
import { generateMovieExplanation } from '@/lib/openai';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid movie ID' },
        { status: 400 }
      );
    }

    const movie = await getMovieDetails(id);

    // Generate AI explanation
    let aiExplanation = '';
    try {
      aiExplanation = await generateMovieExplanation({
        title: movie.title,
        overview: movie.overview,
        genres: movie.genres?.map(g => g.name) || [],
        rating: movie.vote_average,
      });
    } catch (error) {
      console.error('Failed to generate AI explanation:', error);
    }

    return NextResponse.json({
      ...movie,
      aiExplanation,
    });
  } catch (error: any) {
    console.error('Movie details error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch movie details' },
      { status: 500 }
    );
  }
}

