'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/10 bg-black sm:mt-24">
      <div className="mx-auto max-w-[1200px] px-6 py-12 sm:px-10 lg:px-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-10">
          <div className="col-span-2 sm:col-span-1">
            <p className="text-sm font-medium text-zinc-300">myMovies</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
              Personalized picks powered by AI. Data from TMDB.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Browse</p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="text-sm text-zinc-400 transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/watchlist" className="text-sm text-zinc-400 transition-colors hover:text-white">
                  My List
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-sm text-zinc-400 transition-colors hover:text-white">
                  Search
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Product</p>
            <ul className="space-y-2.5">
              <li>
                <span className="text-sm text-zinc-500">AI recommendations</span>
              </li>
              <li>
                <span className="text-sm text-zinc-500">Watchlist</span>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Legal</p>
            <ul className="space-y-2.5">
              <li>
                <span className="text-sm text-zinc-500">Privacy</span>
              </li>
              <li>
                <span className="text-sm text-zinc-500">Terms</span>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-white/10 pt-8 text-center text-xs text-zinc-600">
          © {currentYear} myMovies
        </p>
      </div>
    </footer>
  );
}
