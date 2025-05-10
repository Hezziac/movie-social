import { useState, useEffect, useRef } from 'react';
import { searchMovies, getPopularMovies, Movie } from '../context/tmdb-client';

interface MovieSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (movie: Movie) => void;
}

export const MovieSearchModal = ({ isOpen, onClose, onSelect }: MovieSearchModalProps) => {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>(null);

  // Load popular movies when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadMovies = async () => {
      setLoading(true);
      try {
        const popular = await getPopularMovies();
        setMovies(popular.slice(0, 12)); // Show top 12 popular movies
        inputRef.current?.focus();
      } catch (err) {
        setError('Failed to load popular movies');
      } finally {
        setLoading(false);
      }
    };

    loadMovies();

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen || query.trim() === '') return;

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      try {
        setLoading(true);
        setError('');
        const results = await searchMovies(query);
        setMovies(results);
      } catch (err) {
        setError('Failed to search movies');
        setMovies([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-gray-900 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Search Movies
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-3xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        
        {/* Search Input */}
        <div className="relative mb-8">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for movies..."
            className="w-full p-4 pl-12 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
          />
          <div className="absolute left-4 top-4 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {loading && (
            <div className="absolute right-4 top-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {movies.map((movie) => (
            <div 
              key={movie.id}
              onClick={() => onSelect(movie)}
              className="cursor-pointer group relative overflow-hidden rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
            >
              {movie.poster_path ? (
                <>
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div>
                      <h3 className="font-bold text-white">{movie.title}</h3>
                      <p className="text-sm text-gray-300">
                        {movie.release_date?.split('-')[0]}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center bg-gray-700 text-gray-400 p-4 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h18M3 16h18" />
                  </svg>
                  {movie.title}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {!loading && movies.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-300 mb-2">
              {query ? 'No movies found' : 'Search for movies'}
            </h3>
            <p className="text-gray-500">
              {query ? 'Try a different search term' : 'Start typing to search TMDB'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};