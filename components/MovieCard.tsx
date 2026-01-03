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
}: MovieCardProps) {
  const year = release_date?.split('-')[0];
  const rating = vote_average ? vote_average.toFixed(1) : 'N/A';

  return (
    <Link href={`/movie/${id}`} className="block group fade-in">
      <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 ease-out transform hover:-translate-y-2 border border-gray-800/50 hover:border-gray-700">
        <div className="relative aspect-[2/3] bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
          <img
            src={getPosterUrl(poster_path)}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjI1MCIgeT0iMzc1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPk5vIFBvc3RlciBBdmFpbGFibGU8L3RleHQ+PC9zdmc+';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {rank && (
            <div className="absolute top-3 left-3 bg-black text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm shadow-lg">
              #{rank}
            </div>
          )}
          
          {vote_average && (
            <div className="absolute top-3 right-3 bg-black/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 shadow-lg">
              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{rating}</span>
            </div>
          )}
        </div>
        
        <div className="p-5">
          <h3 className="font-bold text-lg mb-1.5 line-clamp-2 group-hover:text-white transition-colors leading-tight text-white">
            {title}
          </h3>
          
          {year && (
            <p className="text-gray-400 text-sm mb-3 font-medium">{year}</p>
          )}
          
          {aiExplanation && (
            <p className="text-sm text-gray-300 italic mb-2 line-clamp-2 leading-relaxed">
              &quot;{aiExplanation}&quot;
            </p>
          )}
          
          {overview && !aiExplanation && (
            <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
              {overview}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

