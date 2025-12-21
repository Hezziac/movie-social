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
import { Favorite, FavoriteBorder, Close, CalendarMonth } from "@mui/icons-material";
import { Movie } from "../context/tmdb-client";

interface Props {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MovieDetailModal = ({ movie, isOpen, onClose }: Props) => {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

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
    if (!user) return alert("Please sign in to favorite movies!");
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
          overview: movie.overview
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative bg-gray-900 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 text-white/50 hover:text-white bg-black/20 rounded-full p-1">
          <Close />
        </button>

        {/* Poster Section */}
        <div className="w-full md:w-2/5 aspect-[2/3] bg-gray-800">
          <img 
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
            className="w-full h-full object-cover" 
            alt={movie.title} 
          />
        </div>

        {/* Details Section */}
        <div className="p-6 md:p-8 flex-1 flex flex-col">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">{movie.title}</h2>
          
          <div className="flex items-center gap-2 text-purple-400 mb-4 font-medium">
            <CalendarMonth fontSize="small" />
            <span>{new Date(movie.release_date).getFullYear()}</span>
          </div>

          <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6 line-clamp-6">
            {movie.overview || "No overview available for this title."}
          </p>

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
    </div>
  );
};