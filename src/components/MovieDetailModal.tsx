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
import { Favorite, FavoriteBorder, Close, CalendarMonth, ExpandMore, ExpandLess } from "@mui/icons-material";
import { Movie, getMovieDetails, getMovieTrailer } from "../context/tmdb-client";
import { SignInModal } from "./SignInModal";

interface Props {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MovieDetailModal = ({ movie: initialMovie, isOpen, onClose }: Props) => {
  const { user } = useAuth();

  // States
  const [movie, setMovie] = useState<Movie | null>(initialMovie);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [confirmedNSFW, setConfirmedNSFW] = useState(false);

  // Sync internal movie state and fetch missing data
  useEffect(() => {
    if (isOpen && initialMovie) {
      setMovie(initialMovie);
      setConfirmedNSFW(false);

      const fetchData = async () => {
        // Fetch full details if overview is missing
        if (!initialMovie.overview || initialMovie.vote_average === 0) {
          const fullDetails = await getMovieDetails(initialMovie.id);
          if (fullDetails) setMovie(fullDetails);
        }

        // Fetch trailer if not NSFW or confirmed
        if (!initialMovie.isNSFW || confirmedNSFW) {
          const trailer = await getMovieTrailer(initialMovie.id);
          if (trailer) {
            setTrailerUrl(`${trailer}?autoplay=1&mute=1&controls=1&rel=0`);
          }
        }
      };

      fetchData();
    }

    return () => {
      setTrailerUrl(null);
      setMovie(null);
    };
  }, [initialMovie?.id, isOpen, confirmedNSFW]);

  // Check favorite status
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
  }, [isOpen, movie?.id, user]);

  if (!isOpen || !movie) return null;

  const isHidden = movie.isNSFW && !confirmedNSFW;

  const toggleFavorite = async () => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    setLoading(true);
    try {
      if (isFavorited) {
        await supabase.from("user_movies").delete().eq("user_id", user.id).eq("movie_id", movie.id);
        setIsFavorited(false);
      } else {
        await supabase.from("movies").upsert({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          overview: movie.overview,
          vote_average: movie.vote_average
        });
        await supabase.from("user_movies").insert({ user_id: user.id, movie_id: movie.id, status: "favorite" });
        setIsFavorited(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const displayedOverview = isExpanded ? movie.overview : movie.overview?.slice(0, 180) + (movie.overview?.length > 180 ? "..." : "");

  // Adjusted the iframe and modal layout to ensure the video does not break the modal size and the movie tile is centered below it
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 md:p-12 bg-black/90 backdrop-blur-md">
      {/* Backdrop Click to Close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-gray-900 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* FIXED CLOSE BUTTON */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-[110] text-white/70 hover:text-white bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10"
        >
          <Close />
        </button>

        {/* UNIFIED SCROLLABLE AREA */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
          
          {/* MEDIA SECTION: Always stays at the top of the scroll flow */}
          <div className="w-full aspect-video bg-gray-800 flex-shrink-0 relative overflow-hidden z-10">
            {trailerUrl && !isHidden ? (
              <iframe 
                src={trailerUrl}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Movie Trailer"
              />
            ) : (
              <div className="w-full h-full">
                {movie.poster_path ? (
                   <img 
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                    className={`w-full h-full object-cover transition-all duration-700 ${isHidden ? "blur-3xl scale-110 grayscale" : ""}`} 
                    alt={movie.title} 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">No Preview</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
              </div>
            )}

            {/* NSFW Restricted Overlay */}
            {isHidden && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/60 backdrop-blur-sm">
                <h3 className="text-white font-bold mb-2">Restricted Content</h3>
                <p className="text-[10px] text-gray-400 mb-6 leading-tight">Confirm you are 18+ to view details.</p>
                <button 
                  onClick={() => user ? setConfirmedNSFW(true) : setShowSignInModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-6 py-2.5 rounded-full transition-all"
                >
                  {user ? "CONFIRM AGE & REVEAL" : "SIGN IN TO VIEW"}
                </button>
              </div>
            )}
          </div>

          {/* DETAILS SECTION */}
          <div className="p-6 md:p-8 flex flex-col">
            
            {/* MOVIE TILE: Removed negative margin so it is pushed DOWN below the video */}
            {!isHidden && (
              <div className="w-full flex justify-center mb-6 z-30">
                <img 
                  src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} 
                  className="w-32 rounded-xl shadow-2xl border-2 border-white/10"
                  alt="Poster"
                />
              </div>
            )}

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight text-center">
              {movie.title}
            </h2>
            
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-purple-400 font-medium text-sm">
                <CalendarMonth sx={{ fontSize: 18 }} />
                <span>{movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}</span>
              </div>

              {movie.vote_average > 0 && (
                <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-0.5 rounded-full">
                  <span className="text-yellow-500 text-xs">⭐</span>
                  <span className="text-yellow-500 text-sm font-bold">{movie.vote_average.toFixed(1)}</span>
                </div>
              )}
            </div>

            <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-line text-center">
              {movie.overview ? displayedOverview : "Fetching description..."}
            </p>
            
            {movie.overview && movie.overview.length > 180 && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-purple-400 text-sm font-bold mt-2 flex items-center gap-1 hover:text-purple-300 mx-auto"
              >
                {isExpanded ? <><ExpandLess fontSize="small"/> Show Less</> : <><ExpandMore fontSize="small"/> Read More</>}
              </button>
            )}

            <div className="mt-8 flex justify-center">
              <button
                onClick={toggleFavorite}
                disabled={loading}
                className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold transition-all ${
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

      <SignInModal 
        isOpen={showSignInModal} 
        onClose={() => setShowSignInModal(false)} 
        actionName="view restricted content" 
      />
    </div>
  );
};