/* [MovieSearchModal.tsx]
 *
 ** A UI component for displaying movie posters with interactive hover effects.
 * * * * SOURCE ATTRIBUTION:
 * This component's functional logic (fetching/displaying TMDB data) was based on:
 * [Tech With Tim - Learn React With This ONE Project](https://youtu.be/G6D9cBaLViA?si=1EzGXxDseUnhyomX)
 * * * * Note on AI Usage: 
 * - **Visual Design & UI**: While the logic follows the tutorial, the visual 
 * implementation (Tailwind CSS) was refactored with GitHub Copilot and Perplexity AI. 
 * - **Styling Features**: AI was specifically used to implement the custom 
 * "Glow Effect" (gradient blur), the backdrop-blur glassmorphism, and the 
 * responsive sizing (w-24 vs w-32) to fit my social feed's aesthetic.
 * - **Refactoring**: AI assisted in making the component resilient to missing 
 * poster images by generating the fallback gradient and emoji layout.
 */
 
import { Movie } from "../context/tmdb-client";

interface Props {
  movie: Movie;
}

export const MovieTile = ({ movie }: Props) => {
  return (
    <div className="relative group w-24 h-32 md:w-32 md:h-44">
      {/* Custom UI: Glow effect and hover transitions pinpointed and 
          implemented with AI to match the project's purple/pink theme. */}
      {/* 1. Glow Effect: Only show if NOT NSFW */}
      {!movie.isNSFW && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-0 group-hover:opacity-75 transition-opacity duration-300 z-0"></div>
      )}      
      {/* Main tile */}
      <div className={`relative w-full h-full bg-gray-900/90 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700/50 shadow-lg transition-transform ${
        !movie.isNSFW ? "group-hover:border-purple-400/30" : ""
      }`}>
        {movie.poster_path ? (
          <div className="relative w-full h-full">
            <img
              src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
              alt={movie.title}
              // 🚨 Apply heavy blur and grayscale if flagged
              className={`w-full h-full object-cover transition-all duration-500 ${
                movie.isNSFW ? "blur-2xl grayscale brightness-50" : ""
              }`}
            />
            {/* 🚨 NSFW Warning Label */}
            {movie.isNSFW && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-red-600/80 text-[10px] text-white font-bold px-2 py-0.5 rounded backdrop-blur-md border border-white/20">
                  18+
                </span>
              </div>
            )}
          </div>
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
      {!movie.isNSFW && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <p className="text-xs text-white font-medium truncate">{movie.title}</p>
          {movie.release_date && (
            <p className="text-xs text-gray-400">{movie.release_date.split('-')[0]}</p>
          )}
        </div>
      )}
    </div>
  );
};