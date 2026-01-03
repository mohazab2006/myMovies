'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import SearchBarWithSuggestions from './SearchBarWithSuggestions';

export default function Navbar() {
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);
  
  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    // Load watchlist count
    const updateWatchlistCount = () => {
      const saved = localStorage.getItem('watchlist');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setWatchlistCount(Array.isArray(parsed) ? parsed.length : 0);
        } catch {
          setWatchlistCount(0);
        }
      } else {
        setWatchlistCount(0);
      }
    };

    updateWatchlistCount();
    
    // Listen for storage changes (when watchlist is updated in another tab)
    window.addEventListener('storage', updateWatchlistCount);
    
    // Custom event for same-tab updates
    window.addEventListener('watchlistUpdated', updateWatchlistCount);
    
    return () => {
      window.removeEventListener('storage', updateWatchlistCount);
      window.removeEventListener('watchlistUpdated', updateWatchlistCount);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800 shadow-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-20">
          <Link href="/" className="flex items-center gap-4 group flex-shrink-0">
            {/* Logo - Add your logo.jpg to /public folder */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              {!logoError ? (
                <Image
                  src="/logo.jpg"
                  alt="Logo"
                  width={64}
                  height={64}
                  className="object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border border-gray-700">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
              )}
            </div>
            <span className="text-3xl font-bold text-white group-hover:text-gray-300 transition-all">
              myMovies
            </span>
          </Link>
          
          {/* Search Bar with Suggestions */}
          <SearchBarWithSuggestions />
          
          <div className="flex gap-2 flex-shrink-0">
            <Link
              href="/watchlist"
              className={`px-5 py-2.5 rounded-lg font-medium text-base transition-all duration-200 relative ${
                isActive('/watchlist')
                  ? 'bg-white text-black shadow-md'
                  : 'text-white hover:bg-gray-900'
              }`}
              style={{ color: isActive('/watchlist') ? 'black' : 'white' }}
            >
              Watchlist
              {watchlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {watchlistCount > 99 ? '99+' : watchlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/"
              className={`px-5 py-2.5 rounded-lg font-medium text-base transition-all duration-200 ${
                isActive('/')
                  ? 'bg-white text-black shadow-md'
                  : 'text-white hover:bg-gray-900'
              }`}
              style={{ color: isActive('/') ? 'black' : 'white' }}
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

