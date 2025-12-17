// components/MovieTile.tsx
import { Movie } from "../context/tmdb-client";

interface Props {
  movie: Movie;
}

export const MovieTile = ({ movie }: Props) => {
  return (
    <div className="relative group w-24 h-32 md:w-32 md:h-44">
      {/* Glow effect - constrained to tile size */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-0 group-hover:opacity-75 transition-opacity duration-300 z-0"></div>
      
      {/* Main tile */}
      <div className="relative w-full h-full bg-gray-900/90 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700/50 shadow-lg transition-transform group-hover:border-purple-400/30">
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 p-2">
            <span className="text-2xl mb-1">🎬</span>
            <p className="text-xs text-center text-gray-300 font-medium truncate w-full px-1">
              {movie.title}
            </p>
            {movie.release_date && (
              <p className="text-xs text-gray-500 mt-1">
                {movie.release_date.split('-')[0]}
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Title overlay on hover */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <p className="text-xs text-white font-medium truncate">{movie.title}</p>
        {movie.release_date && (
          <p className="text-xs text-gray-400">{movie.release_date.split('-')[0]}</p>
        )}
      </div>
    </div>
  );
};