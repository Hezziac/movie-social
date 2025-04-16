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

// Global request cache - Cache for basic rate limiting
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


export const getPopularMovies = async (): Promise<Movie[]> => {
  const now = Date.now();
  if (popularMoviesCache.data.length > 0 && 
      now - popularMoviesCache.timestamp < popularMoviesCache.ttl) {
    return popularMoviesCache.data;
  }

  try {
    const data = await makeRequest("movie/popular");
    popularMoviesCache.data = data.results || []; // Ensure array fallback
    popularMoviesCache.timestamp = now;
    return popularMoviesCache.data;
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    return []; // Always return array (never null)
  }
};

export const searchMovies = async (query: string): Promise<Movie[]> => {
  try {
    const data = await makeRequest("search/movie", {
      query: encodeURIComponent(query),
    });
    return data.results || [];
  } catch (error) {
    console.error("Error searching movies:", error);
    return [];
  }
};

// Optional: Get movie details
export const getMovieDetails = async (id: number): Promise<Movie | null> => {
  try {
    const data = await makeRequest(`movie/${id}`);
    return data as Movie;
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return null;
  }
};
