# myMovies

AI-powered movie recommendation app built with Next.js.

Describe what you're in the mood for and it'll find movies that actually match — not just random suggestions.

## Features

- **AI recommendations** — describe what you want in plain English
- **Filters** — narrow down by genre, rating, runtime, year
- **Search** — find specific movies or browse by actor
- **Watchlist** — save stuff to watch later (stored in your browser)
- **Trending** — see what's popular this week
- **Seasonal picks** — Halloween movies in October, holiday films in December, etc.

## Stack

- Next.js 14
- TypeScript
- Tailwind
- OpenAI API (GPT-4)
- TMDB API

## Setup

```bash
npm install
```

Create `.env.local`:
```
OPENAI_API_KEY=your_key
TMDB_API_KEY=your_key
```

Get your keys from:
- OpenAI: https://platform.openai.com/api-keys
- TMDB: https://www.themoviedb.org/settings/api

Run it:
```bash
npm run dev
```

Open http://localhost:3000

## How the AI works

When you type something like "90s action movie with a good soundtrack", the app sends that to GPT-4 along with your filters. GPT returns a list of movie titles that match. Then we look those up on TMDB to get posters, ratings, and details.

The AI also explains why it picked each movie, which shows up on the cards.

## File structure

```
app/
  page.tsx          # home page with recommendations
  search/           # search results page
  watchlist/        # saved movies
  movie/[id]/       # movie detail page
  api/              # backend routes
    generate/       # AI recommendations
    search/         # movie search
    trending/       # trending movies
    seasonal/       # seasonal picks

components/         # reusable UI stuff
lib/                # API clients (openai, tmdb)
```

---

Built because Netflix recommendations got stale and I wanted something smarter.
