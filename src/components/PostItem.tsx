import { Link } from "react-router";
import { Post } from "./PostList";
import { MovieTile } from "./MovieTile";
// import { Movie } from "../context/tmdb-client";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { useState, useRef, useEffect } from "react";
import { useGesture } from "@use-gesture/react";
import { isMobile } from "../context/isMobile";
// imports for likebutton functionality 
import { useAuth } from "../context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";

interface Props {
  post: Post;
  isFirst?: boolean;
  isLast?: boolean;
}

export const PostItem = ({ post, isFirst = false, isLast = false }: Props) => {
  const hasImage = !!post.image_url;
  const isTextOnly = !hasImage;

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 0.5, y: 0.5 });
  const [isZooming, setIsZooming] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fingers state
  const [pinchStarted, setPinchStarted] = useState(false);
  const positionRef = useRef({ x: 0, y: 0 });
  const lastOffsetRef = useRef({ x: 0, y: 0 });

  // Gesture handling
  const bind = useGesture(
    {
      onPinchStart: ({ origin: [ox, oy], event }) => {
        // 🚨 only enter pinch mode when exactly two fingers are down
        // if (!("touches" in event) || event.touches.length !== 2) return;
        event.preventDefault();

        setIsZooming(true);
        setPinchStarted(true);

        const rect = imageRef.current?.getBoundingClientRect();
        if (!rect) return;

        setOrigin({
          x: (ox - rect.left) / rect.width,
          y: (oy - rect.top) / rect.height,
        });
      },

      onPinch: ({ offset: [d], origin: [ox, oy], event }) => {
        // 🚨 still require two fingers here
        // if (!("touches" in event) || event.touches.length !== 2) return;
        event.preventDefault();
        // recompute the pinch center under your fingers
        const rect = imageRef.current!.getBoundingClientRect();
        setOrigin({
          x: (ox - rect.left) / rect.width,
          y: (oy - rect.top) / rect.height,
        });
        let newZoom = 0;
        newZoom = Math.max(1, 1 + d / 50);
        // map the cumulative pinch distance into scale
        setZoom(newZoom);
      },

      onPinchEnd: () => {
        setIsZooming(false);
        setPinchStarted(false);
        if (zoom <= 5) {
          resetZoom(); // only reset if user didn’t zoom in meaningfully
        } else {
          // lastOffsetRef.current = positionRef.current;
          resetZoom();
        }
      },

      onDrag: ({ movement: [mx, my], delta: [dx, dy], cancel }) => {
        if (!pinchStarted) return cancel?.();
        if (zoom <= 1) return cancel?.();
        const newX = lastOffsetRef.current.x + dx + mx;
        const newY = lastOffsetRef.current.y + dy + my;

        setPosition({ x: newX, y: newY });
        positionRef.current = { x: newX, y: newY };
      },

      onDragEnd: () => {
        lastOffsetRef.current = positionRef.current;
      },
    },
    {
      drag: {
        from: () => [0, 0],
        filterTaps: true,
        rubberband: true,
      },
      pinch: {
        distanceBounds: { min: 0, max: Infinity }, // Allow infinite zoom out or in
        scaleBounds: { min: 1, max: Infinity }, // Explicitly remove any scale cap
        rubberband: true,
      },
      eventOptions: { passive: false },
    }
  );

  const resetZoom = () => {
    const img = imageRef.current?.querySelector(".mobile-zoom-image");
    img?.classList.add("reset-transition");
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    positionRef.current = { x: 0, y: 0 };
    lastOffsetRef.current = { x: 0, y: 0 };
    setTimeout(() => {
      img?.classList.remove("reset-transition");
    }, 300);
  };

  // Handle scroll prevention during zoom
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (zoom > 1 && e.touches.length === 1) {
        e.preventDefault(); // Only block scroll when zoomed in
      }
    };

    const handleTouchEnd = () => {
      if (isZooming) {
        setIsZooming(false);
        resetZoom();
      }
    };

    if (isMobile()) {
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isZooming, zoom]);

  // HEART LIKE FUNCTION (copied from your LikeButton)
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const vote = async (voteValue: number) => {
    if (!user) return;
    
    const { data: existingVote } = await supabase
      .from("votes")
      .select("*")
      .eq("post_id", post.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingVote) {
      if (existingVote.vote === voteValue) {
        await supabase.from("votes").delete().eq("id", existingVote.id);
      } else {
        await supabase.from("votes").update({ vote: voteValue }).eq("id", existingVote.id);
      }
    } else {
      await supabase.from("votes").insert({ post_id: post.id, user_id: user.id, vote: voteValue });
    }
  };

  const { mutate } = useMutation({
    mutationFn: () => vote(1), // THUMBS UP ONLY
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] }); // Refresh ALL posts
    },
  });

  // 1. Check if the post has the new movie fields returned by the SQL function
  // We check for movie_id and movie_title to ensure we have something meaningful.
  const hasMovieData = post.movie_id && post.movie_title;

  // 2. Conditionally construct the Movie object structure that MovieTile expects.
  // We use the new flat properties (e.g., post.movie_title) to build the nested object.
  const movieForTile = hasMovieData ? {
      id: post.movie_id!,
      title: post.movie_title!,
      poster_path: post.movie_poster_path,
      release_date: post.movie_release_date || 'N/A',
      // The Movie interface (from tmdb-client.ts) requires these, 
      // so we use placeholders since your SQL function doesn't return them.
      overview: post.movie?.overview ||'', 
      vote_average: 0, 
  } : null;

  return (
    <>
      <div
        className="w-full snap-start relative flex justify-center"
        style={{
          height: "calc(100dvh - 4rem)",
          paddingBottom: "env(safe-area-inset-bottom)",
          touchAction: isZooming ? "none" : "pan-y",
        }}
      >
        {/* Scroll indicators */}
        {!isFirst && !isZooming && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 animate-bounce">
            <KeyboardArrowUp className="text-white/70 text-4xl" />
          </div>
        )}

        {!isLast && !isZooming && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 animate-bounce">
            <KeyboardArrowDown className="text-white/70 text-4xl" />
          </div>
        )}

        {/* Post container */}
        <div className="w-full max-w-2xl h-full relative">
          {isTextOnly && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-600 z-0" />
          )}

          <div
            className={`relative z-10 h-full flex flex-col ${
              hasImage ? "bg-black" : ""
            }`}
          >
            {/* Header */}
            {/* 💡 1. Wrap the avatar and info with a Link to the profile using the username */}
            <div className="flex items-center gap-3 p-4 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent">
              <Link to={`/profile/${post.username}`} className="flex items-center gap-3">
                {post.avatar_url ? (
                  <img
                    src={post.avatar_url}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tl from-purple-500 to-pink-500" />
                )}
              </Link>
              
              <div className="flex-1 min-w-0">
                {/* 💡 2. Wrap the title (and implicitly the post itself) with a Link to the post details */}
                <Link to={`/post/${post.id}`}>
                  <h3 className="font-semibold text-white truncate hover:underline">
                    {post.title}
                  </h3>
                </Link>
                {/* Assuming you display the username/author here, you can link it too */}
                <p className="text-xs text-gray-300">
                  {/* You could display and link the username here if you want */}
                  {/* <Link to={`/profile/${post.username}`} className="hover:underline">@{post.username}</Link> - */}
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Content area */}
            <div
              className={`flex-1 relative ${
                isZooming ? "overflow-visible pb-0" : "overflow-hidden pb-16"
              }`}
            >
              {hasImage && (
                <div
                  ref={imageRef}
                  {...(isMobile() ? bind() : {})}
                  className={`mobile-zoom-container ${
                    isZooming ? "fixed inset-0 z-[1001]" : "absolute inset-0"
                  } flex items-center justify-center`}
                  style={{
                    touchAction: pinchStarted || zoom > 1 ? "none" : "pan-y",
                  }}
                >
                  <div
                    className="mobile-zoom-image w-full h-full transition-transform duration-300 ease-out"
                    style={{
                      transformOrigin: `${origin.x * 100}% ${origin.y * 100}%`,
                      transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})`,
                    }}
                  >
                    {post.image_url && !post.image_url.startsWith("blob:") ? (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-contain select-none"
                        draggable="false"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 select-none">
                        Image unavailable
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DIM BACKGROUND IF IMAGE IS ZOOMED  */}
              {isZooming && (
                <div className="fixed inset-0 bg-black/70 z-40 pointer-events-none transition-opacity duration-200" />
              )}

              {/* FULL WIDTH GRADIENT SCRIM (only for images) */}
              {hasImage && !isZooming && (
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/75 via-black/40 to-transparent z-10 pointer-events-none" />
              )}

              <div
                className={`relative h-full flex flex-col ${
                  hasImage ? "justify-end" : "items-center justify-center"
                } p-6 gap-4 z-20`}
              >
                {/* 🎬 CONTAINER: Handles Side-by-Side vs Stacked */}
                <div className={`flex w-full gap-3 ${hasImage ? "flex-row items-end" : "flex-col items-center"}`}>
                  {/* MOVIE TILE */}
                  {movieForTile && (
                    <div className={`z-30 w-full flex-shrink-0 ${hasImage ? "w-24 md:w-32" : "w-full max-w-[250px]"}`}>
                      <MovieTile movie={movieForTile} />
                    </div>
                  )}

                  {/* 📝 POST CONTENT: Always visible, max 4 lines */}
                  {post.content && (
                    <div
                      className={`whitespace-pre-line z-20 min-w-0 flex-1 ${
                        hasImage
                          ? "text-white flex-1 text-sm md:text-base drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] pb-1"
                          : "text-white text-xl md:text-2xl text-center px-4"
                      }`}
                    >
                      <p className="line-clamp-4 leading-tight">{post.content}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-end items-end">

              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-center">
                  {/* LIKE BUTTON FUNCTIONALITY */}
                  <button 
                    onClick={() => mutate()}
                    disabled={!user}
                    className="p-2 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed
                      hover:bg-white/20 bg-white/10"
                    title={!user ? "Sign in to like" : "Like post"}
                  >
                    ❤️
                  </button>
                  <span className="text-xs text-white mt-1">
                    {post.like_count ?? 0}
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <Link
                    to={`/post/${post.id}`}
                    className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition"
                  >
                    💬
                  </Link>
                  <span className="text-xs text-white mt-1">
                    {post.comment_count ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLast && <div className="h-16 w-full"></div>}
    </>
  );
};
