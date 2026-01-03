'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string, type: 'title' | 'actor' | 'keyword') => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'title' | 'actor' | 'keyword'>('title');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), searchType);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for movies..."
          className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="title"
            checked={searchType === 'title'}
            onChange={(e) => setSearchType(e.target.value as 'title')}
            className="w-4 h-4 text-black dark:text-white focus:ring-black dark:focus:ring-white"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="actor"
            checked={searchType === 'actor'}
            onChange={(e) => setSearchType(e.target.value as 'actor')}
            className="w-4 h-4 text-black dark:text-white focus:ring-black dark:focus:ring-white"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Actor</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="keyword"
            checked={searchType === 'keyword'}
            onChange={(e) => setSearchType(e.target.value as 'keyword')}
            className="w-4 h-4 text-black dark:text-white focus:ring-black dark:focus:ring-white"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Keyword</span>
        </label>
      </div>
    </form>
  );
}

