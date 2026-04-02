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
        <label className="mb-2 block text-xs font-medium text-zinc-400 sm:mb-3 sm:text-sm">
          Genres {selectedGenres.length > 0 && <span className="text-zinc-200">({selectedGenres.length})</span>}
        </label>
        <div className="flex flex-wrap gap-2">
          {genres.map(genre => (
            <button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                selectedGenres.includes(genre)
                  ? 'border-white bg-white text-black'
                  : 'border-white/25 bg-transparent text-zinc-300 hover:border-white/50 hover:text-white'
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
        className="flex w-full items-center justify-between rounded border border-white/15 bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
      >
        <span className="text-xs font-medium text-zinc-300 sm:text-sm">
          More filters {hasActiveFilters && <span className="text-brand">·</span>}
        </span>
        <span className={`text-zinc-500 transition-transform sm:text-sm ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* Advanced Filters Content */}
      {isExpanded && (
        <div className="grid grid-cols-1 gap-4 rounded border border-white/10 bg-black/30 p-4 md:grid-cols-3 md:gap-4 md:p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">Min rating</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={minRating || ''}
              onChange={(e) =>
                onMinRatingChange(e.target.value ? parseFloat(e.target.value) : null)
              }
              className="w-full rounded border border-white/20 bg-black/40 px-3 py-2 text-white placeholder-zinc-600 outline-none transition-colors focus:border-white/40"
              placeholder="0.0"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">Max runtime (min)</label>
            <input
              type="number"
              min="0"
              value={runtimeLimit || ''}
              onChange={(e) =>
                onRuntimeLimitChange(e.target.value ? parseInt(e.target.value) : null)
              }
              className="w-full rounded border border-white/20 bg-black/40 px-3 py-2 text-white placeholder-zinc-600 outline-none transition-colors focus:border-white/40"
              placeholder="120"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-400">Year range</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1900"
                max={currentYear}
                value={yearFrom || ''}
                onChange={(e) =>
                  onYearFromChange(e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full rounded border border-white/20 bg-black/40 px-3 py-2 text-white placeholder-zinc-600 outline-none transition-colors focus:border-white/40"
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
                className="w-full rounded border border-white/20 bg-black/40 px-3 py-2 text-white placeholder-zinc-600 outline-none transition-colors focus:border-white/40"
                placeholder="To"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

