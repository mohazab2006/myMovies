'use client';

import { useState } from 'react';

interface FiltersProps {
  genres: string[];
  selectedGenres: string[];
  onGenreChange: (genres: string[]) => void;
  minRating: number | null;
  onMinRatingChange: (rating: number | null) => void;
  runtimeLimit: number | null;
  onRuntimeLimitChange: (runtime: number | null) => void;
  yearFrom: number | null;
  yearTo: number | null;
  onYearFromChange: (year: number | null) => void;
  onYearToChange: (year: number | null) => void;
}

export default function Filters({
  genres,
  selectedGenres,
  onGenreChange,
  minRating,
  onMinRatingChange,
  runtimeLimit,
  onRuntimeLimitChange,
  yearFrom,
  yearTo,
  onYearFromChange,
  onYearToChange,
}: FiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentYear = new Date().getFullYear();

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onGenreChange(selectedGenres.filter(g => g !== genre));
    } else {
      onGenreChange([...selectedGenres, genre]);
    }
  };

  const hasActiveFilters = selectedGenres.length > 0 || minRating || runtimeLimit || yearFrom || yearTo;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Genres Section */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-gray-200">
          Genres {selectedGenres.length > 0 && <span className="text-white">({selectedGenres.length})</span>}
        </label>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {genres.map(genre => (
            <button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                selectedGenres.includes(genre)
                  ? 'bg-white text-black shadow-md transform scale-105'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2.5 sm:p-3 bg-gray-900/50 rounded-lg hover:bg-gray-800 border border-gray-800 transition-colors"
      >
        <span className="text-xs sm:text-sm font-semibold text-gray-200">
          Advanced Filters {hasActiveFilters && <span className="text-white">●</span>}
        </span>
        <span className={`transform transition-transform text-xs sm:text-sm ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Advanced Filters Content */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-200">
              Min Rating
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={minRating || ''}
              onChange={(e) =>
                onMinRatingChange(e.target.value ? parseFloat(e.target.value) : null)
              }
              className="w-full px-4 py-2 border-2 border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all placeholder-gray-400"
              placeholder="0.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-200">
              Max Runtime (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={runtimeLimit || ''}
              onChange={(e) =>
                onRuntimeLimitChange(e.target.value ? parseInt(e.target.value) : null)
              }
              className="w-full px-4 py-2 border-2 border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all placeholder-gray-400"
              placeholder="120 min"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-200">
              Year Range
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1900"
                max={currentYear}
                value={yearFrom || ''}
                onChange={(e) =>
                  onYearFromChange(e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full px-4 py-2 border-2 border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all placeholder-gray-400"
                placeholder="From"
              />
              <input
                type="number"
                min="1900"
                max={currentYear}
                value={yearTo || ''}
                onChange={(e) =>
                  onYearToChange(e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full px-4 py-2 border-2 border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all placeholder-gray-400"
                placeholder="To"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

