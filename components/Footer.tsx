'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-gray-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">myMovies</h3>
            <p className="text-gray-400 text-sm">
              Discover your next favorite movie with AI-powered recommendations.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/watchlist" className="text-gray-400 hover:text-white text-sm transition-colors">
                  My Watchlist
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Search
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">About</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-gray-400 text-sm">Powered by AI</span>
              </li>
              <li>
                <span className="text-gray-400 text-sm">Movie data from TMDB</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-gray-400 text-sm">Privacy Policy</span>
              </li>
              <li>
                <span className="text-gray-400 text-sm">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-900">
          <p className="text-gray-500 text-sm text-center">
            © {currentYear} myMovies. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

