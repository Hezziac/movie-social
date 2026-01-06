/* [tmdb-client.ts]
 *
 * This component is a client utility for interacting with The Movie Database (TMDB) API.
 * Handles fetching popular movies, search queries, and movie details.
 * * * * SOURCE ATTRIBUTION:
 * This component's core structure and API logic were based on:
 * [Tech With Tim - Learn React With This ONE Project](https://youtu.be/G6D9cBaLViA?si=1EzGXxDseUnhyomX)
 * * * * Note on AI Usage: 
 * - **API Learning & Documentation**: GitHub Copilot and Perplexity AI were used to 
 * interpret the TMDB API documentation and understand the structure of the JSON responses.
 * - **Performance & Caching**: AI helped implement a custom 'Global Request Cache' 
 * and 'Active Requests' map. This ensures the app doesn't make duplicate API calls 
 * for the same movie data, staying within rate limits and improving speed.
 * - **Error Handling**: AI assisted in refactoring the 'makeRequest' wrapper to 
 * provide consistent error catching and TypeScript return types across all API calls.
 */

// Movie Type
export interface Movie {
    id: number;
    title: string;
    poster_path: string | null;
    release_date: string;
    overview: string;
    vote_average: number;
    // Add other fields as needed
}

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;

// Performance Optimization: Refactored with AI to implement request caching 
// and "in-flight" request tracking. This prevents the app from firing 
// multiple identical network requests simultaneously.
const requestCache = new Map<string, { timestamp: number; data: any }>();
const activeRequests = new Map<string, Promise<any>>();

// Specialized cache for popular movies
const popularMoviesCache = {
  data: [] as Movie[],
  timestamp: 0,
  ttl: 30000, // 30 seconds
};

const makeRequest = async (
  endpoint: string,
  params?: Record<string, string>
) => {
  // 1. Build URL safely
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("api_key", API_KEY);

  // 2. Add any additional parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  // 3. Check cache first
  const cacheKey = url.toString();
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 30_000) {
    return cached.data; // Return cached data if fresh
  }

  // 4. Check for identical in-flight requests
  if (activeRequests.has(cacheKey)) {
    return activeRequests.get(cacheKey);
  }

  // 5. Make actual request
  const requestPromise = fetch(url.toString())
    .then(response => {
      if (!response.ok) throw new Error(`TMDB Error: ${response.status}`);
      return response.json();
    })
    .then(data => {
      requestCache.set(cacheKey, { timestamp: Date.now(), data });
      return data;
    })
    .finally(() => {
      activeRequests.delete(cacheKey);
    });

  activeRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

// Add a list of words you want to block entirely from your app
const NSFW_KEYWORDS = [
  'porn', 'xxx', 'sex', 'erotic', 'hardcore', 
  'hentai', 'pornstar', 'brazzers', 'lust'
];

// Helper function to check if a movie is safe
const isSafeContent = (movie: any): boolean => {
  const title = (movie.title || "").toLowerCase();
  const overview = (movie.overview || "").toLowerCase();

  // If any banned word is in the title or description, return false
  return !NSFW_KEYWORDS.some(word => title.includes(word) || overview.includes(word));
};

// Update getPopularMovies to filter NSFW content
export const getPopularMovies = async (): Promise<Movie[]> => {
  const now = Date.now();
  if (popularMoviesCache.data.length > 0 && 
      now - popularMoviesCache.timestamp < popularMoviesCache.ttl) {
    return popularMoviesCache.data;
  }

  try {
    const data = await makeRequest("movie/popular", { include_adult: "false" });
    // FILTER RESULTS HERE
    const filteredResults = (data.results || []).filter(isSafeContent);

    popularMoviesCache.data = filteredResults;
    popularMoviesCache.timestamp = now;
    return filteredResults;
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    return [];
  }
};

// Update searchMovies to filter NSFW content
export const searchMovies = async (query: string): Promise<Movie[]> => {
  try {
    const data = await makeRequest("search/movie", {
      query: encodeURIComponent(query),
      include_adult: "false",
      language: "en-US",
    });

    // FILTER SEARCH RESULTS HERE
    return (data.results || []).filter(isSafeContent);

  } catch (error) {
    console.error("Error searching movies:", error);
    return [];
  }
};

// Fetch logic assisted by AI to ensure movie details are correctly cast 
// to the TypeScript 'Movie' interface after being retrieved from the API.
export const getMovieDetails = async (id: number): Promise<Movie | null> => {
  try {
    const data = await makeRequest(`movie/${id}`);
    return data as Movie;
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return null;
  }
};
