# myMovies

AI-powered movie recommendation app built with Next.js.

## What it does

- AI-powered movie recommendations tailored to user preferences
- Search for movies by title or actor
- View detailed movie information, including descriptions, cast, reviews, and ratings
- Save and manage movies in a personalized watchlist

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` file:
   ```env
   OPENAI_API_KEY=your_openai_key
   TMDB_API_KEY=your_tmdb_key
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## How to use

- **Get recommendations**: Enter what you want (e.g., "funny movie") and click Generate
- **Search**: Use the search bar to find movies
- **Watchlist**: Click "Add to Watchlist" on any movie to save it

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- OpenAI API
- TMDB API
