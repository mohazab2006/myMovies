'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getPosterUrl } from '@/lib/tmdb';
import Link from 'next/link';

interface MovieSuggestion {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  vote_average?: number;
  overview?: string;
}

export default function SearchBarWithSuggestions() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MovieSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch suggestions as user types
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (data.results) {
          setSuggestions(data.results);
          setShowSuggestions(data.results.length > 0);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectMovie(suggestions[selectedIndex]);
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelectMovie = (movie: MovieSuggestion) => {
    setQuery('');
    setShowSuggestions(false);
    router.push(`/movie/${movie.id}`);
  };

  const handleSearch = () => {
    if (query.trim()) {
      setShowSuggestions(false);
      // Navigate to search results or show results inline
      router.push(`/?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-2xl mx-0 sm:mx-2 md:mx-4">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder="Search movies..."
          className="w-full px-3 sm:px-4 py-1.5 sm:py-2 md:py-2.5 pl-7 sm:pl-9 md:pl-10 pr-8 sm:pr-10 md:pr-12 border-2 border-gray-700 rounded-lg sm:rounded-xl bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 text-xs sm:text-sm placeholder-gray-400"
        />
        <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setShowSuggestions(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1.5 sm:mt-2 bg-gray-900 rounded-lg sm:rounded-xl shadow-2xl border border-gray-800 max-h-80 sm:max-h-96 overflow-y-auto fade-in">
          {isLoading ? (
            <div className="p-3 sm:p-4 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-black dark:border-white border-t-transparent"></div>
              <p className="mt-2 text-xs sm:text-sm">Searching...</p>
            </div>
          ) : (
            <>
              {suggestions.map((movie, index) => {
                const year = movie.release_date?.split('-')[0];
                const rating = movie.vote_average?.toFixed(1) || 'N/A';
                const isSelected = index === selectedIndex;

                return (
                  <Link
                    key={movie.id}
                    href={`/movie/${movie.id}`}
                    onClick={() => {
                      setQuery('');
                      setShowSuggestions(false);
                    }}
                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-gray-800 transition-all duration-200 cursor-pointer border-b border-gray-800 last:border-b-0 ${
                      isSelected ? 'bg-gray-800' : ''
                    }`}
                  >
                    {/* Movie Poster */}
                    <div className="flex-shrink-0 w-10 h-14 sm:w-12 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                      {movie.poster_path ? (
                        <img
                          src={getPosterUrl(movie.poster_path)}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Movie Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 sm:gap-2">
                        <h3 className="font-semibold text-xs sm:text-sm text-white truncate">
                          {movie.title}
                        </h3>
                        {movie.vote_average && (
                          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-[10px] sm:text-xs font-medium text-gray-300">
                              {rating}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                        {year && (
                          <span className="text-[10px] sm:text-xs text-gray-400">{year}</span>
                        )}
                        {movie.overview && (
                          <>
                            <span className="text-gray-600 text-[10px] sm:text-xs">•</span>
                            <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-1 flex-1">
                              {movie.overview}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Arrow Icon */}
                    <div className="flex-shrink-0 text-gray-400">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
              
              {/* View All Results */}
              {query.trim() && (
                <div
                  onClick={handleSearch}
                  className="p-2.5 sm:p-3 bg-gray-800 border-t border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer text-center"
                >
                  <span className="text-xs sm:text-sm font-medium text-white">
                    View all results for &quot;{query}&quot;
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

