'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MovieCard from '@/components/MovieCard';
import MovieRow from '@/components/MovieRow';
import Filters from '@/components/Filters';
import { getBackdropUrl } from '@/lib/tmdb';

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

  const showBrowseShell = !isSearchMode && results.length === 0;
  const featured = trendingMovies[0];

  useEffect(() => {
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
      .then((data) => {
        if (data.error) {
          console.error('API error:', data.error);
          setError(data.error);
        } else if (data.genres) {
          setGenres(data.genres.map((g: { name: string }) => g.name));
        }
      })
      .catch((err) => {
        console.error('Failed to fetch genres:', err);
        setError(err.message || 'Failed to load genres. Please check your API keys.');
      });

    const fetchDefaultMovies = async () => {
      setIsLoadingDefault(true);
      try {
        const trendingRes = await fetch('/api/trending?time_window=week');
        if (trendingRes.ok) {
          const trendingData = await trendingRes.json();
          setTrendingMovies(trendingData.results?.slice(0, 18) || []);
        }

        const seasonalRes = await fetch('/api/seasonal');
        if (seasonalRes.ok) {
          const seasonalData = await seasonalRes.json();
          setSeasonalMovies(seasonalData.results?.slice(0, 18) || []);
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

  useEffect(() => {
    const handleHomeReset = () => {
      setResults([]);
      setError(null);
      setIsSearchMode(false);
      setSearchQuery(null);
      setPrompt('');
    };
    window.addEventListener('homeReset', handleHomeReset);
    return () => window.removeEventListener('homeReset', handleHomeReset);
  }, []);

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
    <div className="min-h-screen bg-surface">
      <Navbar />

      {showBrowseShell && (
        <>
          <section className="relative min-h-[min(90vh,920px)] w-full overflow-hidden bg-black">
            {featured?.backdrop_path ? (
              <img
                src={getBackdropUrl(featured.backdrop_path)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-black" />
            )}
            <div className="hero-vignette absolute inset-0" aria-hidden />
            <div className="relative flex min-h-[min(90vh,920px)] flex-col justify-end px-4 pb-10 pt-24 sm:px-8 sm:pb-12 md:px-12 lg:justify-end lg:px-16 lg:pb-14 lg:pt-28">
              <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-end gap-10 lg:grid-cols-[1fr_minmax(300px,420px)] lg:gap-12 xl:gap-16">
                <div className="max-w-2xl lg:max-w-none lg:pb-1">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand sm:text-xs">
                    AI-powered picks
                  </p>
                  <h1 className="text-[2.25rem] font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[3.15rem] xl:text-[3.35rem]">
                    {featured?.title ?? 'Movies worth your night.'}
                  </h1>
                  <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-zinc-300 line-clamp-4 sm:text-base md:text-lg">
                    {featured?.overview
                      ? featured.overview
                      : 'Describe the vibe in the panel—we surface titles that fit, like a concierge for your couch.'}
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/watchlist"
                      className="inline-flex items-center justify-center rounded border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 sm:px-6 sm:py-3"
                    >
                      My List
                    </Link>
                  </div>
                  {isLoadingDefault && trendingMovies.length === 0 && (
                    <div className="mt-6 flex items-center gap-3 text-sm text-zinc-500">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
                      Loading spotlight…
                    </div>
                  )}
                </div>

                <div
                  id="discover"
                  className="rounded-xl border border-white/15 bg-black/55 p-5 shadow-2xl backdrop-blur-md sm:p-6 lg:p-7"
                >
                  <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                    Dial in your taste
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                    What are you in the mood for? Add a line or two—optional genres and filters below.
                  </p>
                  <div className="mt-5">
                    <label htmlFor="hero-mood" className="sr-only">
                      What are you in the mood for?
                    </label>
                    <textarea
                      id="hero-mood"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. A slow-burn thriller with moral gray areas, or a feel-good 90s comedy."
                      className="min-h-[88px] w-full resize-none rounded-lg border border-white/15 bg-black/40 px-3.5 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-white/35 focus:ring-1 focus:ring-white/20 sm:min-h-[100px] sm:px-4 sm:text-[0.9375rem]"
                      rows={3}
                    />
                  </div>

                  <div className="mt-5 max-h-[min(40vh,320px)] overflow-y-auto overflow-x-hidden pr-1 scrollbar-hide sm:max-h-none sm:overflow-visible">
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
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isLoading || (!prompt && selectedGenres.length === 0)}
                    className="mt-6 flex w-full items-center justify-center rounded bg-brand py-3.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-45 sm:text-base"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden>
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-90"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Finding matches…
                      </span>
                    ) : (
                      'Get recommendations'
                    )}
                  </button>

                  {error && (
                    <div className="mt-4 rounded border border-red-500/35 bg-red-950/40 px-4 py-3 text-xs leading-relaxed text-red-200 sm:text-sm">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {!isLoadingDefault && trendingMovies.length > 0 && (
            <div className="relative z-10 -mt-10 md:-mt-14">
              <MovieRow title="Trending now">
                {trendingMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    id={movie.id}
                    title={movie.title}
                    poster_path={movie.poster_path}
                    release_date={movie.release_date}
                    vote_average={movie.vote_average}
                    variant="row"
                  />
                ))}
              </MovieRow>
            </div>
          )}

          {!isLoadingDefault && seasonalMovies.length > 0 && (
            <MovieRow title={seasonName ? `${seasonName} picks` : 'Seasonal picks'}>
              {seasonalMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  poster_path={movie.poster_path}
                  release_date={movie.release_date}
                  vote_average={movie.vote_average}
                  variant="row"
                />
              ))}
            </MovieRow>
          )}

        </>
      )}

      {(!showBrowseShell || isSearchMode) && (
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-10">
          {error && !showBrowseShell && (
            <div className="mb-8 rounded border border-red-500/30 bg-red-950/30 px-5 py-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="fade-in">
              <h2 className="mb-8 text-xl font-semibold text-white md:text-2xl">
                {isSearchMode ? (
                  <>
                    Results
                    {searchQuery && (
                      <span className="mt-1 block text-sm font-normal text-zinc-500 md:inline md:ml-2 md:mt-0">
                        for &quot;{searchQuery}&quot;
                      </span>
                    )}
                  </>
                ) : (
                  'Your shortlist'
                )}
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                {results.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    id={movie.id}
                    title={movie.title}
                    poster_path={movie.poster_path}
                    release_date={movie.release_date}
                    vote_average={movie.vote_average}
                    overview={movie.overview}
                    aiExplanation={movie.aiExplanation}
                    rank={movie.rank}
                  />
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center py-24 text-center">
              <div className="mb-5 h-11 w-11 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
              <p className="text-sm font-medium text-zinc-300 md:text-base">
                {isSearchMode ? 'Searching the catalog…' : 'Ranking titles for you…'}
              </p>
              <p className="mt-2 text-xs text-zinc-600">Usually a few seconds</p>
            </div>
          )}

          {isSearchMode && !isLoading && results.length === 0 && !error && (
            <p className="py-16 text-center text-sm text-zinc-500">No titles matched that search.</p>
          )}
        </main>
      )}

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface">
          <Navbar />
          <div className="flex min-h-screen items-center justify-center pt-14">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
