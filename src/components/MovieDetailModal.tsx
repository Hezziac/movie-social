/** [MovieDetailModal.tsx]
 * * A modal to show detailed movie information and allow users to toggle 
 * favorites, syncing with the Supabase 'user_movies' junction table.
 * * * Note on AI Usage: 
 * - **Database Sync**: AI helped implement the logic to first check if a movie 
 * exists in the 'movies' table before inserting the favorite link, 
 * preventing foreign key errors.
 */ 
import { useState, useEffect } from "react";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { Favorite, FavoriteBorder, Close, CalendarMonth, ExpandMore, ExpandLess} from "@mui/icons-material";
import { Movie } from "../context/tmdb-client";
import { SignInModal } from "./SignInModal";

interface Props {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MovieDetailModal = ({ movie, isOpen, onClose }: Props) => {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Check if this movie is already favorited by the user
  useEffect(() => {
    if (isOpen && movie && user) {
      const checkStatus = async () => {
        const { data } = await supabase
          .from("user_movies")
          .select("*")
          .eq("user_id", user.id)
          .eq("movie_id", movie.id)
          .maybeSingle();
        setIsFavorited(!!data);
      };
      checkStatus();
    }
  }, [isOpen, movie, user]);

  if (!isOpen || !movie) return null;

  const toggleFavorite = async () => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    setLoading(true);

    try {
      if (isFavorited) {
        // Remove from favorites
        await supabase
          .from("user_movies")
          .delete()
          .eq("user_id", user.id)
          .eq("movie_id", movie.id);
        setIsFavorited(false);
      } else {
        // 1. Ensure movie exists in our 'movies' table first (Caching TMDB data)
        const { error: movieError } = await supabase.from("movies").upsert({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          overview: movie.overview,
          vote_average: movie.vote_average
        });

        if (movieError) throw movieError;

        // 2. Add to user_movies junction table
        await supabase.from("user_movies").insert({
          user_id: user.id,
          movie_id: movie.id,
          status: "favorite"
        });
        setIsFavorited(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const shouldShowReadMore = movie.overview && movie.overview.length > 200;
  const displayedOverview = isExpanded ? movie.overview : movie.overview?.slice(0, 200) + (shouldShowReadMore ? "..." : "");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      {/* Backdrop Click to Close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-gray-900 border border-white/10 w-full max-w-2xl rounded-3xl overflow-y-auto max-h-[90vh] shadow-2xl flex flex-col md:flex-row scrollbar-hide">
        {/* Fixed Close Button (Top Right) */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-20 text-white/70 hover:text-white bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10"
        >
          <Close />
        </button>

        {/* Poster Section: Shrinks on mobile */}
        <div className="w-full md:w-2/5 aspect-[2/3] bg-gray-800 flex-shrink-0 relative overflow-hidden">
          <div className="md:absolute md:inset-0">
            
            <img 
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
              className="w-full h-full object-cover" 
              alt={movie.title} 
              />
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6 md:p-8 flex-1 flex flex-col">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
            {movie.title}
          </h2>
          
          <div className="flex items-center gap-4 mb-4">
          {/* Release Year */}
          <div className="flex items-center gap-1.5 text-purple-400 font-medium text-sm">
            <CalendarMonth sx={{ fontSize: 18 }} />
            <span>{movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}</span>
          </div>

          {/* TMDB Rating Badge: Only shows if vote_average exists and is > 0 */}
          {movie.vote_average && movie.vote_average > 0 ? (
            <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.1)]">
              <span className="text-yellow-500 text-xs">⭐</span>
              <span className="text-yellow-500 text-sm font-bold leading-none">
                {movie.vote_average.toFixed(1)}
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-gray-500 italic px-2 py-0.5 border border-white/5 rounded-full">
              No rating
            </div>
          )}
        </div>

          {/* Overview Section with Read More */}
          <div className="mb-6">
            <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {displayedOverview || "No overview available."}
            </p>
            {shouldShowReadMore && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-purple-400 text-sm font-bold mt-2 flex items-center gap-1 hover:text-purple-300"
              >
                {isExpanded ? <><ExpandLess fontSize="small"/> Show Less</> : <><ExpandMore fontSize="small"/> Read More</>}
              </button>
            )}
          </div>

          <div className="mt-auto flex justify-end">
            <button
              onClick={toggleFavorite}
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
                isFavorited 
                ? "bg-red-500/10 text-red-500 border border-red-500/50" 
                : "bg-white text-black hover:bg-purple-500 hover:text-white"
              }`}
            >
              {isFavorited ? <Favorite /> : <FavoriteBorder />}
              {isFavorited ? "Favorited" : "Add to Favorites"}
            </button>
          </div>
        </div>
      </div>

      <SignInModal 
        isOpen={showSignInModal} 
        onClose={() => setShowSignInModal(false)} 
        actionName="favorite movies" 
        />
    </div>
  );
};    