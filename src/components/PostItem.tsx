import { Link } from "react-router";
import { Post } from "./PostList";
import { MovieTile } from "./MovieTile";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { useState, useRef, useEffect } from "react";
import { useGesture } from "@use-gesture/react";
import { isMobile } from "../context/isMobile";

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

      onDrag: ({ movement: [mx, my], delta: [dx, dy], cancel, event }) => {
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
            <div className="flex items-center gap-3 p-4 absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent">
              {post.avatar_url ? (
                <img
                  src={post.avatar_url}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tl from-purple-500 to-pink-500" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">
                  {post.title}
                </h3>
                <p className="text-xs text-gray-300">
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
              <div
                className={`relative h-full flex ${
                  hasImage ? "items-end" : "items-center justify-center"
                } p-6`}
              >
                <div
                  className={`whitespace-pre-line ${
                    hasImage
                      ? "text-white w-full"
                      : "text-white text-xl md:text-2xl text-center"
                  }`}
                >
                  {post.content}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end">
              <div className="flex-1">
                {post.movie && <MovieTile movie={post.movie} />}
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-center">
                  <button className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition">
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
