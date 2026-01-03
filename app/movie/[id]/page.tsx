'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getPosterUrl, getBackdropUrl } from '@/lib/tmdb';

export default function MovieDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [movie, setMovie] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<number[]>([]);

  useEffect(() => {
    // Load watchlist from localStorage
    const loadWatchlist = () => {
      const saved = localStorage.getItem('watchlist');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Handle both old format (array of numbers) and new format (array of objects)
          const ids = parsed.map((item: any) => 
            typeof item === 'number' ? item : item.id
          );
          setWatchlist(ids);
        } catch (error) {
          console.error('Failed to parse watchlist:', error);
          setWatchlist([]);
        }
      }
    };

    loadWatchlist();
    
    // Listen for watchlist updates
    window.addEventListener('watchlistUpdated', loadWatchlist);
    
    return () => {
      window.removeEventListener('watchlistUpdated', loadWatchlist);
    };
  }, []);

  // Debug cast data when movie loads
  useEffect(() => {
    if (movie?.credits?.cast) {
      const cast = movie.credits.cast.slice(0, 10);
      console.log('=== CAST DEBUG ===');
      cast.forEach((a: any, index: number) => {
        const normalized = a.profile_path && !a.profile_path.startsWith('/') 
          ? `/${a.profile_path}` 
          : a.profile_path;
        console.log(`${index + 1}. ${a.name}:`, {
          profile_path: a.profile_path,
          normalized: normalized,
          type: typeof a.profile_path,
          isNull: a.profile_path === null,
          isUndefined: a.profile_path === undefined,
          isEmpty: a.profile_path === '',
          constructedUrl: normalized ? `https://image.tmdb.org/t/w500${normalized}` : 'N/A'
        });
      });
      console.log('==================');
    }
  }, [movie]);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    fetch(`/api/movie/${id}`)
      .then(async (res) => {
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          console.error('Non-JSON response:', text.substring(0, 500));
          throw new Error('Server returned non-JSON response. Check if API keys are set in .env.local file.');
        }
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setMovie(data);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load movie');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const toggleWatchlist = () => {
    if (!movie) return;

    // Load current watchlist
    const saved = localStorage.getItem('watchlist');
    let currentWatchlist: any[] = [];
    
    if (saved) {
      try {
        currentWatchlist = JSON.parse(saved);
        // Handle old format (array of numbers)
        if (currentWatchlist.length > 0 && typeof currentWatchlist[0] === 'number') {
          currentWatchlist = currentWatchlist.map((id: number) => ({
            id,
            addedAt: new Date().toISOString(),
          }));
        }
      } catch (error) {
        console.error('Failed to parse watchlist:', error);
        currentWatchlist = [];
      }
    }

    const isInWatchlist = currentWatchlist.some((item: any) => 
      (typeof item === 'number' ? item : item.id) === movie.id
    );

    let newWatchlist: any[];
    if (isInWatchlist) {
      newWatchlist = currentWatchlist.filter((item: any) => 
        (typeof item === 'number' ? item : item.id) !== movie.id
      );
    } else {
      newWatchlist = [
        ...currentWatchlist,
        {
          id: movie.id,
          addedAt: new Date().toISOString(),
          watched: false,
        },
      ];
    }

    setWatchlist(newWatchlist.map((item: any) => typeof item === 'number' ? item : item.id));
    localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
    
    // Dispatch event to update navbar count
    window.dispatchEvent(new Event('watchlistUpdated'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black dark:border-white border-t-transparent"></div>
            <p className="mt-4 text-gray-300 font-medium">Loading movie details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-900/20 border-l-4 border-red-500 text-red-400 px-6 py-4 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="font-medium">{error || 'Movie not found'}</p>
            </div>
          </div>
          <Link
            href="/"
            className="mt-4 inline-block px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const year = movie.release_date?.split('-')[0];
  const rating = movie.vote_average?.toFixed(1) || 'N/A';
  const runtime = movie.runtime ? `${movie.runtime} min` : 'N/A';
  const genres = movie.genres?.map((g: { name: string }) => g.name).join(', ') || 'N/A';
  const cast = movie.credits?.cast?.slice(0, 10) || [];

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      {/* Backdrop */}
      {movie.backdrop_path && (
        <div className="relative h-96 overflow-hidden">
          <img
            src={getBackdropUrl(movie.backdrop_path)}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0">
            <img
              src={getPosterUrl(movie.poster_path)}
              alt={movie.title}
              className="w-64 rounded-xl shadow-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjI1MCIgeT0iMzc1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPk5vIFBvc3RlciBBdmFpbGFibGU8L3RleHQ+PC9zdmc+';
              }}
            />
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-white">{movie.title}</h1>
                <div className="flex flex-wrap gap-4 text-gray-300 mb-4 font-medium">
                  <span>{year}</span>
                  <span>•</span>
                  <span>{runtime}</span>
                  <span>•</span>
                  <span>{genres}</span>
                </div>
              </div>
              <button
                onClick={toggleWatchlist}
                className={`px-5 py-2.5 rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl ${
                  watchlist.includes(movie.id)
                    ? 'bg-white text-black hover:bg-gray-100'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {watchlist.includes(movie.id) ? '✓ In Watchlist' : '+ Add to Watchlist'}
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2 bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-gray-800">
                <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xl font-bold text-white">{rating}</span>
                <span className="text-gray-300 text-sm">
                  ({movie.vote_count?.toLocaleString()} votes)
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-3 text-white">Overview</h2>
              <p className="text-gray-300 leading-relaxed text-lg">
                {movie.overview || 'No overview available.'}
              </p>
            </div>

            {movie.aiExplanation && (
              <div className="mb-6 bg-gray-900/50 border-l-4 border-white p-5 rounded-lg shadow-md fade-in">
                <h2 className="text-xl font-bold mb-2 text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Why you might like this
                </h2>
                <p className="text-gray-300 italic leading-relaxed">
                  {movie.aiExplanation}
                </p>
              </div>
            )}

            {cast.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4 text-white">Cast</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {cast.map((actor: any) => {
                    const getInitials = (name: string) => {
                      return name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);
                    };

                    // Check if profile_path exists and is not null/empty
                    // profile_path from TMDB should start with '/' (e.g., "/abc123.jpg")
                    const profilePath = actor.profile_path;
                    const hasProfilePath = profilePath && 
                                          typeof profilePath === 'string' && 
                                          profilePath.trim() !== '' &&
                                          profilePath !== 'null' &&
                                          profilePath !== null &&
                                          profilePath !== undefined;
                    
                    // Ensure profile_path starts with '/' for proper URL construction
                    const normalizedPath = hasProfilePath && !profilePath.startsWith('/') 
                      ? `/${profilePath}` 
                      : profilePath;

                    return (
                      <div key={actor.id} className="text-center group">
                        {hasProfilePath ? (
                          <div className="relative aspect-[2/3] mb-3 rounded-lg overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105 bg-gray-800">
                            <img
                              src={`https://image.tmdb.org/t/p/w500${normalizedPath}`}
                              alt={actor.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const currentSrc = target.src;
                                
                                // Try different sizes as fallback
                                if (currentSrc.includes('w500')) {
                                  target.src = `https://image.tmdb.org/t/p/w342${normalizedPath}`;
                                } else if (currentSrc.includes('w342')) {
                                  target.src = `https://image.tmdb.org/t/p/w185${normalizedPath}`;
                                } else {
                                  // All sizes failed, show placeholder with initials
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const initials = getInitials(actor.name);
                                    parent.innerHTML = `
                                      <div class="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex flex-col items-center justify-center border border-gray-600">
                                        <span class="text-2xl font-bold text-white">${initials}</span>
                                      </div>
                                    `;
                                  }
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="aspect-[2/3] bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl mb-3 flex flex-col items-center justify-center shadow-md border border-gray-600">
                            <span className="text-2xl font-bold text-white">{getInitials(actor.name)}</span>
                          </div>
                        )}
                        <p className="font-semibold text-sm text-white mb-1">{actor.name}</p>
                        <p className="text-xs text-gray-400 line-clamp-2">{actor.character}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

