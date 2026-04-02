'use client';

import Link from 'next/link';
import { getPosterUrl } from '@/lib/tmdb';

interface MovieCardProps {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
  vote_average?: number;
  overview?: string;
  aiExplanation?: string;
  rank?: number;
  /** Poster-focused tile for horizontal rows (Netflix-style). */
  variant?: 'default' | 'row';
}

export default function MovieCard({
  id,
  title,
  poster_path,
  release_date,
  vote_average,
  overview,
  aiExplanation,
  rank,
  variant = 'default',
}: MovieCardProps) {
  const year = release_date?.split('-')[0];
  const rating = vote_average ? vote_average.toFixed(1) : 'N/A';

  if (variant === 'row') {
    return (
      <Link
        href={`/movie/${id}`}
        className="group relative z-0 w-[110px] flex-shrink-0 sm:w-[132px] md:w-[148px] lg:w-[160px]"
        title={title}
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded bg-zinc-800 shadow-md ring-1 ring-white/10 transition duration-200 ease-out group-hover:z-20 group-hover:scale-[1.08] group-hover:shadow-xl group-hover:ring-white/25">
          <img
            src={getPosterUrl(poster_path)}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgZmlsbD0iIzI3MjcyYSIvPjwvc3ZnPg==';
            }}
          />
          {vote_average != null && vote_average > 0 && (
            <span className="absolute right-1.5 top-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white tabular-nums">
              {rating}
            </span>
          )}
        </div>
        <span className="sr-only">{title}</span>
      </Link>
    );
  }

  return (
    <Link href={`/movie/${id}`} className="group block fade-in">
      <div className="overflow-hidden rounded-md bg-zinc-900 ring-1 ring-white/10 transition duration-200 ease-out hover:ring-white/20">
        <div className="relative aspect-[2/3] overflow-hidden bg-zinc-800">
          <img
            src={getPosterUrl(poster_path)}
            alt={title}
            className="h-full w-full object-cover transition duration-300 ease-out group-hover:scale-[1.04]"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjI1MCIgeT0iMzc1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPk5vIFBvc3RlciBBdmFpbGFibGU8L3RleHQ+PC9zdmc+';
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

          {rank != null && (
            <div className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/80 text-xs font-bold text-white">
              #{rank}
            </div>
          )}

          {vote_average != null && vote_average > 0 && (
            <div className="absolute right-2 top-2 flex items-center gap-1 rounded bg-black/75 px-2 py-1 text-xs font-medium text-white tabular-nums">
              <svg className="h-3 w-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {rating}
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="line-clamp-2 text-[0.95rem] font-semibold leading-snug text-white">{title}</h3>

          {year && <p className="mt-1 text-xs text-zinc-500">{year}</p>}

          {aiExplanation && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400">&quot;{aiExplanation}&quot;</p>
          )}

          {overview && !aiExplanation && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">{overview}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

