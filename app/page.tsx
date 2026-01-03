'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MovieCard from '@/components/MovieCard';
import Filters from '@/components/Filters';
import { getGenres } from '@/lib/tmdb';

function HomeContent() {
  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [runtimeLimit, setRuntimeLimit] = useState<number | null>(null);
  const [yearFrom, setYearFrom] = useState<number | null>(null);
  const [yearTo, setYearTo] = useState<number | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [seasonalMovies, setSeasonalMovies] = useState<any[]>([]);
  const [seasonName, setSeasonName] = useState<string>('');
  const [isLoadingDefault, setIsLoadingDefault] = useState(true);

  useEffect(() => {
    // Fetch available genres
    fetch('/api/genres')
      .then(async (res) => {
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          console.error('Non-JSON response from /api/genres:', text.substring(0, 200));
          throw new Error('Server returned non-JSON response. Check if API keys are set in .env.local');
        }
        return res.json();
      })
      .then(data => {
        if (data.error) {
          console.error('API error:', data.error);
          setError(data.error);
        } else if (data.genres) {
          setGenres(data.genres.map((g: { name: string }) => g.name));
        }
      })
      .catch(err => {
        console.error('Failed to fetch genres:', err);
        setError(err.message || 'Failed to load genres. Please check your API keys.');
      });

    // Fetch trending and seasonal movies for default display
    const fetchDefaultMovies = async () => {
      setIsLoadingDefault(true);
      try {
        // Fetch trending movies
        const trendingRes = await fetch('/api/trending?time_window=week');
        if (trendingRes.ok) {
          const trendingData = await trendingRes.json();
          setTrendingMovies(trendingData.results?.slice(0, 12) || []);
        }

        // Fetch seasonal movies
        const seasonalRes = await fetch('/api/seasonal');
        if (seasonalRes.ok) {
          const seasonalData = await seasonalRes.json();
          setSeasonalMovies(seasonalData.results?.slice(0, 12) || []);
          setSeasonName(seasonalData.seasonName || '');
        }
      } catch (err) {
        console.error('Failed to fetch default movies:', err);
      } finally {
        setIsLoadingDefault(false);
      }
    };

    fetchDefaultMovies();
  }, []);

  // Handle search query from URL
  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
      setIsSearchMode(true);
      handleSearch(search);
    } else {
      setSearchQuery(null);
      setIsSearchMode(false);
      setResults([]);
    }
  }, [searchParams]);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setIsSearchMode(true);

    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(query)}&type=title`
      );

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error('Server returned non-JSON response. Check if API keys are set in .env.local file.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setIsSearchMode(false);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt || undefined,
          genres: selectedGenres,
          minRating: minRating || undefined,
          runtimeLimit: runtimeLimit || undefined,
          yearFrom: yearFrom || undefined,
          yearTo: yearTo || undefined,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500));
        throw new Error('Server returned non-JSON response. Check if API keys are set in .env.local file.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate recommendations');
      }

      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-white">
            AI Movie Recommendations
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Tell us what you&apos;re in the mood for, and we&apos;ll find the perfect movie for you
          </p>
        </div>

        {/* Input Card - Hide when in search mode */}
        {!isSearchMode && (
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-800">
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3 text-gray-200">
                What kind of movie are you looking for?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'A smart thriller with a twist ending' or 'Something lighthearted and funny from the 90s'"
                className="w-full px-4 py-3 border-2 border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 resize-none placeholder-gray-400"
                rows={3}
              />
            </div>

            <Filters
              genres={genres}
              selectedGenres={selectedGenres}
              onGenreChange={setSelectedGenres}
              minRating={minRating}
              onMinRatingChange={setMinRating}
              runtimeLimit={runtimeLimit}
              onRuntimeLimitChange={setRuntimeLimit}
              yearFrom={yearFrom}
              yearTo={yearTo}
              onYearFromChange={setYearFrom}
              onYearToChange={setYearTo}
            />

            <button
              onClick={handleGenerate}
              disabled={isLoading || (!prompt && selectedGenres.length === 0)}
              className="w-full mt-8 px-6 py-4 bg-white text-black rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating Recommendations...
                </span>
              ) : (
                'Generate Recommendations'
              )}
            </button>
          </div>
        </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-red-900/20 border-l-4 border-red-500 text-red-300 px-6 py-4 rounded-lg shadow-md">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <p className="font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div className="fade-in">
            <h2 className="text-3xl font-bold mb-8 text-white">
              {isSearchMode ? (
                <>Search Results {searchQuery && <span className="text-gray-400">for &quot;{searchQuery}&quot;</span>}</>
              ) : (
                <>Recommended Movies</>
              )}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 fade-in">
              {results.map((movie, index) => (
                <div key={movie.id} style={{ animationDelay: `${index * 50}ms` }}>
                  <MovieCard
                    id={movie.id}
                    title={movie.title}
                    poster_path={movie.poster_path}
                    release_date={movie.release_date}
                    vote_average={movie.vote_average}
                    overview={movie.overview}
                    aiExplanation={movie.aiExplanation}
                    rank={movie.rank}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-black dark:border-white border-t-transparent mb-4"></div>
            <p className="text-lg text-gray-300 font-medium">
              AI is analyzing movies and finding the perfect matches...
            </p>
            <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
          </div>
        )}

        {/* Default Movies - Show when no search/generate results */}
        {!isLoading && results.length === 0 && !error && !isSearchMode && (
          <div className="fade-in">
            {/* Trending Movies Section */}
            {!isLoadingDefault && trendingMovies.length > 0 && (
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6 text-white">This Month&apos;s Top Movies</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {trendingMovies.map((movie, index) => (
                    <div key={movie.id} style={{ animationDelay: `${index * 50}ms` }}>
                      <MovieCard
                        id={movie.id}
                        title={movie.title}
                        poster_path={movie.poster_path}
                        release_date={movie.release_date}
                        vote_average={movie.vote_average}
                        overview={movie.overview}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seasonal Movies Section */}
            {!isLoadingDefault && seasonalMovies.length > 0 && (
              <div>
                <h2 className="text-3xl font-bold mb-6 text-white">
                  {seasonName ? `${seasonName} Movies` : 'Seasonal Recommendations'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {seasonalMovies.map((movie, index) => (
                    <div key={movie.id} style={{ animationDelay: `${index * 50}ms` }}>
                      <MovieCard
                        id={movie.id}
                        title={movie.title}
                        poster_path={movie.poster_path}
                        release_date={movie.release_date}
                        vote_average={movie.vote_average}
                        overview={movie.overview}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading state for default movies */}
            {isLoadingDefault && (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4"></div>
                <p className="text-lg text-gray-300 font-medium">Loading recommendations...</p>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black dark:border-white border-t-transparent"></div>
          </div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
