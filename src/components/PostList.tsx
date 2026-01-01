 /* [PostList.tsx]
 * 
 * Renders a vertically-snapping list of posts. Implements custom scroll 
 * mechanics, touch gestures, and keyboard navigation for a "feed" experience.
 * * * SOURCE ATTRIBUTION:
 * - Originally based on [PedroTech Social Media Tutorial] for the base 
 * React Query setup and Post mapping.
 * - Heavily adapted to include custom database properties (username, movie info) 
 * returned by the 'get_posts_with_counts' SQL function.
 * * * Note on AI Usage: 
 * - **Scroll & Navigation**: GitHub Copilot and Perplexity AI assisted in 
 * implementing the advanced event listeners for 'wheel', 'touchstart', and 
 * 'keydown' to create a smooth, snapping scroll experience.
 * - **UI Design**: AI helped implement the CSS logic to hide scrollbars across 
 * different browsers while maintaining full scrolling functionality.
 * - **SQL Integration**: AI helped refactor the 'Post' interface to correctly 
 * handle the relational movie data joined via the Supabase RPC call.
 * 
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { PostItem } from "./PostItem";
import { Movie } from "../context/tmdb-client";
import { useEffect, useRef, useState } from "react";
import { KeyboardArrowDown } from "@mui/icons-material";

export interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string | null;
  avatar_url?: string | null;
  like_count?: number;
  comment_count?: number;
  aspect_ratio?: string;
  username: string;
  // --- NEW MOVIE PROPERTIES FROM SQL FUNCTION ---
  // Note: These should be nullable since posts without movies will have NULL here
  movie_id: number | null;
  movie_title: string | null;
  movie_poster_path: string | null;
  movie_release_date: string | null;
  movie?: Movie;
  updated_at?: string | null;
}

export const fetchPosts = async (): Promise<(Post & { movie?: Movie })[]> => {
  const { data, error } = await supabase
    .rpc("get_posts_with_counts")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

export const PostList = () => {
  const { data, error, isLoading } = useQuery<Post[], Error>({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  // 1. TELEPORT RESTORATION
  useEffect(() => {
    if (!isLoading && data && containerRef.current) {
      const savedScrollPos = sessionStorage.getItem("feedScrollPos");
      if (savedScrollPos) {
        setIsRestoring(true);
        // Instant jump
        containerRef.current.scrollTop = parseInt(savedScrollPos, 10);
        // Brief delay to allow the jump to finish before enabling CSS Snap
        setTimeout(() => setIsRestoring(false), 50);
      }
    }
  }, [isLoading, data]);

  // 2. SAVE POSITION (Passive)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleSave = () => {
      sessionStorage.setItem("feedScrollPos", container.scrollTop.toString());
    };
    // 'passive: true' ensures we don't slow down the scroll performance
    container.addEventListener("scroll", handleSave, { passive: true });
    return () => container.removeEventListener("scroll", handleSave);
  }, []);

  // 3. LOGO RESET
  useEffect(() => {
    const handleReset = () => {
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: "instant" });
        sessionStorage.removeItem("feedScrollPos"); // Clear pos so it stays at top
      }
    };
    window.addEventListener("resetHomeScroll", handleReset);
    return () => window.removeEventListener("resetHomeScroll", handleReset);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-500 text-center py-10">
        Error: {error.message}
      </div>
    );
  }
  
  return (
    /* Visual Design Refinement: Assisted by AI to apply cross-browser 
       styles to hide the scrollbar (Tailwind + Webkit style tag) 
       to achieve a cleaner "mobile-app" aesthetic on desktop. */
    <div
      ref={containerRef}
      className={`w-full overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] ${
        isRestoring ? "" : "snap-y snap-mandatory"
      } ${isRestoring ? "opacity-0" : "opacity-100 transition-opacity duration-300"}`}
      style={{
        height: '100dvh',
        scrollBehavior: isRestoring ? 'auto' : 'smooth',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      {/* WebKit scrollbar hide */}
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Optional header  with scroll indicator */}
      <div className="h-screen snap-start flex flex-col items-center justify-center bg-black relative">
        <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent px-4 text-center mb-8">
          Recent Posts
        </h2>

        {/* Bouncing arrow indicator */}
        <div className="absolute bottom-39 animate-bounce">
          <KeyboardArrowDown className="text-white/80 text-4xl" />
        </div>

        {/* Optional subtle text hint */}
        <p className="absolute bottom-50 text-white/60 text-sm">
          Scroll to explore
        </p>
      </div>

      {data?.map((post, index) => (
        <PostItem
          post={post}
          key={post.id}
          isFirst={index === 0}
          isLast={index === data.length - 1}
        />
      ))}

      {data?.length === 0 && (
        <div className="h-screen snap-start flex items-center justify-center text-gray-400">
          No posts yet. Be the first to create one!
        </div>
      )}
    </div>
  );
};
