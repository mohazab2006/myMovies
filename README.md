# 🎬 myMovies - AI-Driven Movie Recommendation Web App

A modern web application that uses AI to recommend movies based on user preferences, genres, moods, or free-text "vibe" prompts. The app leverages OpenAI for intelligent ranking and explanations, while using TMDB (The Movie Database) as the source of truth for all movie data.

## ✨ Features

- **AI-Powered Recommendations**: Get personalized movie suggestions based on natural language prompts
- **Genre-Based Filtering**: Select multiple genres to narrow down your search
- **Advanced Filters**: Filter by rating, runtime, and year range
- **Movie Search**: Search by title, actor, or keyword
- **Detailed Movie Pages**: View full movie details with cast, ratings, and AI-generated explanations
- **Watchlist**: Save movies to your watchlist (stored in localStorage)
- **Beautiful UI**: Modern, responsive design with dark mode support

## 🏗️ Architecture

### Core Principles

- **Never process movies one by one** - Always use batch retrieval
- **Never store all movies locally** - Fetch from TMDB API as needed
- **AI = Decision Engine** - AI ranks and explains, but never invents movie facts
- **TMDB = Truth Source** - All movie data comes from TMDB API

### AI Flow

1. **Preference Extraction**: User input → AI converts to structured JSON preferences
2. **Candidate Retrieval**: TMDB Discover API fetches 100-300 matching movies (batch)
3. **AI Ranking**: AI selects top 5-10 movies and provides explanations
4. **Data Hydration**: Fetch full details for selected movies from TMDB

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- TMDB API key ([get one here](https://www.themoviedb.org/settings/api))

### Installation

1. **Clone the repository** (or navigate to the project directory)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   TMDB_API_KEY=your_tmdb_api_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
myMovies/
├── app/
│   ├── api/
│   │   ├── generate/route.ts      # AI recommendation endpoint
│   │   ├── search/route.ts        # Movie search endpoint
│   │   ├── movie/[id]/route.ts   # Movie details endpoint
│   │   └── genres/route.ts       # Genres list endpoint
│   ├── movie/[id]/page.tsx       # Movie detail page
│   ├── search/page.tsx            # Search page
│   ├── page.tsx                   # Home page
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Global styles
├── components/
│   ├── MovieCard.tsx              # Movie card component
│   ├── Filters.tsx                # Filter controls
│   ├── SearchBar.tsx              # Search input
│   └── Navbar.tsx                 # Navigation bar
├── lib/
│   ├── tmdb.ts                    # TMDB API utilities
│   ├── openai.ts                  # OpenAI integration
│   └── prompts.ts                 # AI prompt templates
└── package.json
```

## 🎯 Usage

### Generating Recommendations

1. Go to the home page (`/`)
2. Enter a free-text prompt describing what you want (e.g., "A smart thriller with a twist ending")
3. Optionally select genres, set filters (rating, runtime, year)
4. Click "Generate Movie Recommendations"
5. View AI-ranked results with explanations

### Searching Movies

1. Go to the search page (`/search`)
2. Enter a search query
3. Select search type (Title, Actor, or Keyword)
4. View results

### Viewing Movie Details

1. Click on any movie card
2. View full details including:
   - Poster and backdrop
   - Cast list
   - Ratings and reviews
   - AI-generated explanation
   - Add to watchlist

## 🔧 API Routes

### `POST /api/generate`

Generates movie recommendations using AI.

**Request Body:**
```json
{
  "prompt": "A smart thriller with a twist",
  "genres": ["thriller", "mystery"],
  "minRating": 7.0,
  "runtimeLimit": 120,
  "yearFrom": 2000,
  "yearTo": 2023
}
```

**Response:**
```json
{
  "results": [
    {
      "id": 12345,
      "title": "Movie Title",
      "overview": "...",
      "aiExplanation": "A tense mystery...",
      "rank": 1,
      ...
    }
  ]
}
```

### `GET /api/search`

Searches for movies.

**Query Parameters:**
- `query`: Search query (required)
- `type`: `title`, `actor`, or `keyword` (default: `title`)
- `page`: Page number (default: 1)

### `GET /api/movie/[id]`

Gets detailed movie information.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI API (GPT-4o-mini)
- **Movie Data**: TMDB API
- **State Management**: React hooks + localStorage

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `TMDB_API_KEY` | Your TMDB API key | Yes |

## 🎨 Features in Detail

### AI Recommendation Flow

1. **User Input** → Natural language or filters
2. **Preference Extraction** → AI converts to structured preferences
3. **Batch Retrieval** → Fetch 100-300 candidates from TMDB
4. **AI Ranking** → Select and rank top 5-10 matches
5. **Explanation** → AI provides reasoning for each recommendation

### Search Capabilities

- **Title Search**: Find movies by name
- **Actor Search**: Find movies by actor/actress
- **Keyword Search**: Find movies by keyword

### Watchlist

Movies can be saved to a watchlist stored in browser localStorage. This persists across sessions.

## 🚧 Future Enhancements

- Semantic search via embeddings
- User taste profile
- "Movie night plan" (1 main + backups)
- Account system (Supabase)
- Social features (share recommendations)

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using Next.js, OpenAI, and TMDB
