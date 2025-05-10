// components/MovieTile.tsx
import { Movie } from "../context/tmdb-client";

interface Props {
  movie: Movie;
}

export const MovieTile = ({ movie }: Props) => {
  return (
    <div className="w-24 h-32 md:w-32 md:h-44 bg-gray-900/90 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700 shadow-lg transition-transform hover:scale-105">
      {movie.poster_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800 p-2">
          <div className="text-center">
            <p className="text-xs text-gray-400 truncate">{movie.title}</p>
            {movie.release_date && (
              <p className="text-xs text-gray-500">
                {movie.release_date.split('-')[0]}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};