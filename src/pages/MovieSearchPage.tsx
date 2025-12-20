/** [MovieSearchPage.tsx]
 * 
 * * A dedicated page allowing users to browse popular movies or search for 
 * specific titles using the TMDB API.
 * * * * SOURCE ATTRIBUTION:
 * This component's core search and display logic were based on:
 * [Tech With Tim - Learn React With This ONE Project](https://youtu.be/G6D9cBaLViA?si=1EzGXxDseUnhyomX)
 * * * * Note on AI Usage: 
 * - **State Integration**: AI assisted in adapting the TMDB client methods 
 * into this functional component, ensuring proper TypeScript typing for the 
 * movie results.
 * - **Memory Leak Prevention**: GitHub Copilot helped implement the 'isMounted' 
 * cleanup pattern within the 'useEffect' hook. This prevents the app from 
 * trying to update state on a component that has already been unmounted, 
 * which is a common source of React errors.
 * - **UI Polish**: AI helped refactor the movie grid to be responsive and 
 * provided the logic for the "No Image" fallback placeholder.
 */

import { useState, useEffect } from 'react';
import { getPopularMovies, searchMovies, Movie} from '../context/tmdb-client';

export default function MovieSearchPage() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lifecycle Management: AI assisted in implementing the 'isMounted' pattern 
  // to ensure that asynchronous API responses don't trigger state updates 
  // if the user navigates away from the page before the fetch finishes.
  // Load popular movies on first render
  useEffect(() => {
    let isMounted = true;

    const loadPopular = async () => {
      setLoading(true);
      try {
        const popular = await getPopularMovies();
        if (isMounted) setMovies(popular);
      } catch (err) {
      if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load movies');
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  loadPopular();

  return () => {
    isMounted = false;
  };
}, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      const results = await searchMovies(query);
      setMovies(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Movie Search</h1>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for movies..."
            className="flex-1 p-2 border rounded"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Fallback Logic: AI helped implement this check to handle cases 
                where TMDB does not have an image available for a specific film. */}
        {movies.map((movie) => (
          <div key={movie.id} className="bg-white rounded-lg shadow overflow-hidden">
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full h-auto"
              />
            ) : (
              <div className="bg-gray-200 h-64 flex items-center justify-center">
                No Image
              </div>
            )}
            <div className="p-3">
              <h3 className="font-semibold truncate">{movie.title}</h3>
              <p className="text-sm text-gray-600">
                {movie.release_date?.split('-')[0]}
              </p>
            </div>
          </div>
        ))}
      </div>

      {movies.length === 0 && !loading && (
        <p className="text-center text-gray-500">No movies found</p>
      )}
    </div>
  );
}