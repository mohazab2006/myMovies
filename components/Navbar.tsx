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
  const [scrolled, setScrolled] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleHomeClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      window.dispatchEvent(new Event('homeReset'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
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
    window.addEventListener('storage', updateWatchlistCount);
    window.addEventListener('watchlistUpdated', updateWatchlistCount);
    return () => {
      window.removeEventListener('storage', updateWatchlistCount);
      window.removeEventListener('watchlistUpdated', updateWatchlistCount);
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-[background-color,box-shadow] duration-300 ${
        scrolled
          ? 'bg-[#141414]/97 shadow-[0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md'
          : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-[1920px] items-center gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-10">
        <Link href="/" onClick={handleHomeClick} className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center sm:h-9 sm:w-9">
            {!logoError ? (
              <Image
                src="/logo.jpg"
                alt="myMovies"
                width={36}
                height={36}
                className="object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded bg-zinc-800 text-sm font-bold text-white">
                M
              </div>
            )}
          </div>
          <span className="hidden text-lg font-semibold tracking-tight text-white sm:inline md:text-xl">
            myMovies
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <SearchBarWithSuggestions />
        </div>

        <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/watchlist"
            className={`relative rounded px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 ${
              isActive('/watchlist')
                ? 'text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">My List</span>
            <span className="sm:hidden">List</span>
            {watchlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-sm bg-brand px-1 text-[10px] font-bold text-white">
                {watchlistCount > 99 ? '99+' : watchlistCount}
              </span>
            )}
          </Link>
          <Link
            href="/"
            onClick={handleHomeClick}
            className={`rounded px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 ${
              isActive('/') ? 'text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Home
          </Link>
        </div>
      </div>
    </nav>
  );
}
