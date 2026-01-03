'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import MovieCard from '@/components/MovieCard';
import SearchBar from '@/components/SearchBar';

export default function SearchPage() {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'title' | 'actor' | 'keyword'>('title');

  const handleSearch = async (query: string, type: 'title' | 'actor' | 'keyword') => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setSearchQuery(query);
    setSearchType(type);

    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(query)}&type=${type}`
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

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-white">
            Search Movies
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Find movies by title, actor, or keyword
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-800">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </div>

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

        {results.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-center text-white">
              Search Results {searchQuery && `for "${searchQuery}"`}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {results.map((movie) => (
                <MovieCard
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  poster_path={movie.poster_path}
                  release_date={movie.release_date}
                  vote_average={movie.vote_average}
                  overview={movie.overview}
                />
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-4"></div>
            <p className="text-lg text-gray-300 font-medium">Searching...</p>
          </div>
        )}

        {!isLoading && results.length === 0 && searchQuery && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-300 mb-2">No movies found</p>
            <p className="text-gray-400">Try a different search term</p>
          </div>
        )}
      </main>
    </div>
  );
}

