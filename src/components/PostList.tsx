// PostList.tsx
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { PostItem } from "./PostItem";
import { Movie } from "../context/tmdb-client";
import { useEffect, useRef } from "react";
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
  movie_id?: number | null;
  movie?: Movie;
  aspect_ratio?: string;
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scroll debouncing
    let isScrolling = false;
    let startY: number;

    // Mouse wheel handler
    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) return;
      isScrolling = true;

      const direction = e.deltaY > 0 ? 1 : -1;
      container.scrollBy({
        top: window.innerHeight * direction,
        behavior: "smooth",
      });

      setTimeout(() => (isScrolling = false), 800); // SET SCROLL SPEED
      e.preventDefault();
    };

    // Touch handlers
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      // Only handle touch if not on an image zoom container
      if (!target.closest(".image-zoom-container")) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      // Only handle touch if not on an image zoom container
      if (!target.closest(".image-zoom-container") && startY && !isScrolling) {
        isScrolling = true;
        const endY = e.changedTouches[0].clientY;
        const diff = startY - endY;

        if (Math.abs(diff) > 50) {
          const direction = diff > 0 ? 1 : -1;
          container.scrollBy({
            top: window.innerHeight * direction,
            behavior: "smooth",
          });
        }

        setTimeout(() => (isScrolling = false), 800);
      }
    };

    // Keyboard handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "Space"].includes(e.code)) {
        e.preventDefault();
        const direction = e.code === "ArrowDown" ? 1 : -1;
        container.scrollBy({
          top: window.innerHeight * direction,
          behavior: "smooth",
        });
      }
    };

    // Add all event listeners
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
    };
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
    <div
      ref={containerRef}
      className="w-full overflow-y-auto snap-y snap-mandatory no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none]"
      style={{
        height: '100dvh',
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
