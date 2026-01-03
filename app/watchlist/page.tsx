'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MovieCard from '@/components/MovieCard';
import { getMovieDetails } from '@/lib/tmdb';

interface WatchlistItem {
  id: number;
  addedAt: string;
  watched?: boolean;
  watchedAt?: string;
  rating?: number;
  notes?: string;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unwatched' | 'watched'>('all');
  const [sortBy, setSortBy] = useState<'added' | 'title' | 'rating'>('added');

  useEffect(() => {
    // Load watchlist from localStorage
    const saved = localStorage.getItem('watchlist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Handle both old format (array of numbers) and new format (array of objects)
        const items: WatchlistItem[] = parsed.map((item: any) => {
          if (typeof item === 'number') {
            return { id: item, addedAt: new Date().toISOString() };
          }
          return item;
        });
        setWatchlist(items);
      } catch (error) {
        console.error('Failed to parse watchlist:', error);
        setWatchlist([]);
      }
    }
  }, []);

  useEffect(() => {
    if (watchlist.length === 0) {
      setIsLoading(false);
      return;
    }

    // Fetch movie details for all watchlist items
    const fetchMovies = async () => {
      setIsLoading(true);
      try {
        const moviePromises = watchlist.map((item) =>
          fetch(`/api/movie/${item.id}`)
            .then((res) => res.json())
            .then((data) => ({ ...data, watchlistItem: item }))
            .catch((err) => {
              console.error(`Failed to fetch movie ${item.id}:`, err);
              return null;
            })
        );

        const movieData = await Promise.all(moviePromises);
        setMovies(movieData.filter((m) => m !== null));
      } catch (error) {
        console.error('Failed to fetch movies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, [watchlist]);

  const toggleWatched = (movieId: number) => {
    const updated = watchlist.map((item) => {
      if (item.id === movieId) {
        return {
          ...item,
          watched: !item.watched,
          watchedAt: !item.watched ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });
    setWatchlist(updated);
    localStorage.setItem('watchlist', JSON.stringify(updated));
  };

  const removeFromWatchlist = (movieId: number) => {
    const updated = watchlist.filter((item) => item.id !== movieId);
    setWatchlist(updated);
    localStorage.setItem('watchlist', JSON.stringify(updated));
    setMovies(movies.filter((m) => m.id !== movieId));
  };

  const filteredAndSortedMovies = movies
    .filter((movie) => {
      const item = watchlist.find((w) => w.id === movie.id);
      if (filter === 'watched') return item?.watched === true;
      if (filter === 'unwatched') return !item?.watched;
      return true;
    })
    .sort((a, b) => {
      const itemA = watchlist.find((w) => w.id === a.id);
      const itemB = watchlist.find((w) => w.id === b.id);

      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'rating') {
        return (b.vote_average || 0) - (a.vote_average || 0);
      }
      // Sort by added date (newest first)
      const dateA = itemA?.addedAt || '';
      const dateB = itemB?.addedAt || '';
      return dateB.localeCompare(dateA);
    });

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-5xl font-extrabold mb-4 text-white">My Watchlist</h1>
          <p className="text-gray-300 text-lg">
            {watchlist.length === 0
              ? 'Your watchlist is empty'
              : `${watchlist.length} movie${watchlist.length !== 1 ? 's' : ''} saved`}
          </p>
        </div>

        {watchlist.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-white text-black'
                    : 'bg-gray-900 text-white border border-gray-800 hover:bg-gray-800'
                }`}
              >
                All ({watchlist.length})
              </button>
              <button
                onClick={() => setFilter('unwatched')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'unwatched'
                    ? 'bg-white text-black'
                    : 'bg-gray-900 text-white border border-gray-800 hover:bg-gray-800'
                }`}
              >
                Unwatched ({watchlist.filter((w) => !w.watched).length})
              </button>
              <button
                onClick={() => setFilter('watched')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'watched'
                    ? 'bg-white text-black'
                    : 'bg-gray-900 text-white border border-gray-800 hover:bg-gray-800'
                }`}
              >
                Watched ({watchlist.filter((w) => w.watched).length})
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'added' | 'title' | 'rating')}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white border border-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <option value="added">Sort by: Recently Added</option>
              <option value="title">Sort by: Title</option>
              <option value="rating">Sort by: Rating</option>
            </select>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-4"></div>
            <p className="text-lg text-gray-300 font-medium">Loading your watchlist...</p>
          </div>
        ) : filteredAndSortedMovies.length === 0 ? (
          <div className="text-center py-16 fade-in">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-900 to-black rounded-full flex items-center justify-center border border-gray-800">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-xl text-gray-300 mb-2 font-medium">
              {watchlist.length === 0
                ? 'Your watchlist is empty'
                : filter === 'watched'
                ? 'No watched movies yet'
                : 'No unwatched movies'}
            </p>
            <p className="text-gray-500">
              {watchlist.length === 0
                ? 'Start adding movies to your watchlist!'
                : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 fade-in">
            {filteredAndSortedMovies.map((movie) => {
              const watchlistItem = watchlist.find((w) => w.id === movie.id);
              const isWatched = watchlistItem?.watched || false;

              return (
                <div key={movie.id} className="relative group">
                  <MovieCard
                    id={movie.id}
                    title={movie.title}
                    poster_path={movie.poster_path}
                    release_date={movie.release_date}
                    vote_average={movie.vote_average}
                    overview={movie.overview}
                  />
                  <div className="absolute top-2 right-2 flex gap-2 z-10">
                    <button
                      onClick={() => toggleWatched(movie.id)}
                      className={`p-2 rounded-full shadow-lg transition-all ${
                        isWatched
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-900/90 text-white hover:bg-gray-800'
                      }`}
                      title={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                    >
                      {isWatched ? '✓' : '○'}
                    </button>
                    <button
                      onClick={() => removeFromWatchlist(movie.id)}
                      className="p-2 rounded-full bg-red-600/90 text-white hover:bg-red-700 shadow-lg transition-all"
                      title="Remove from watchlist"
                    >
                      ×
                    </button>
                  </div>
                  {isWatched && (
                    <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      Watched
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

