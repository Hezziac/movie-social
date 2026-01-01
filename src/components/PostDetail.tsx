 /* [PostDetail.tsx]
 * 
 * Contains the detailed view of a post, including the post's title, content, image, and associated movie.
 * It also includes the like/dislike button and comment section components.
 * * * SOURCE ATTRIBUTION:
 * This file was originally provided by the following tutorial:
 * [PedroTech Social Media Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)
 * Adapted significantly to handle custom Movie associations and database schema changes.
 * * * Note on AI Usage: 
 * - **Assistant Teaching**: Used AI as an assistant teacher to understand the 
 * fundamentals of creating and integrating reusable components (like MovieTile) for later use.
 * - **UI/UX Design**: AI assisted in refactoring the visual layout, specifically 
 * for the positioning of the movie tile, implementing the backdrop-blur effects, 
 * and using Tailwind CSS to create the purple-pink gradient aesthetic.
 * - **Database & Types**: GitHub Copilot and Perplexity assisted in modifying 
 * the 'fetchPostById' query to correctly perform a relational join with the 
 * 'movies' table in Supabase.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { Post } from "./PostList";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";
import { MovieTile } from "./MovieTile"; // New component we'll create
import { Movie } from "../context/tmdb-client";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { EditPostModal } from "./EditPostModal";
import { Edit, ArrowBack } from "@mui/icons-material";
import { MovieDetailModal } from "./MovieDetailModal";

interface Props {
  postId: number;
}

// Relational Join Logic: Refactored with AI assistance to fetch movie data 
// alongside the post.
const fetchPostById = async (id: number): Promise<Post & { movie?: Movie; profile?: { username: string }; user_id: string }> => {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      movie:movie_id (*),
      profile:user_id (username)
    `)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const PostDetail = ({ postId }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // Initialize navigate
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for edit modal visibility
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null); // State for movie detail visibility

  const { data, error, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPostById(postId),
  });

  if (isLoading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error.message}</div>;
  if (!data) return <div>Post not found</div>;

  // Determine if user owns the post
  const isOwner = user?.id === data.user_id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors group"
      >
        <ArrowBack className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Feed</span>
      </button>
      {/* Post Header */}
      <div className="flex items-center gap-4 mb-6">
        {/* 1. Avatar Link (Separate from Title Gradient) */}
        <Link to={`/profile/${data.profile?.username}`} className="flex-shrink-0">
          {data.avatar_url ? (
            <img
              src={data.avatar_url}
              alt="User avatar"
              className="w-12 h-12 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500" />
          )}
        </Link>

        {/* 2. Title and Info Link */}
        <Link to={`/profile/${data.profile?.username}`} className="flex-1 min-w-0 group">
          <h1 className="text-2xl font-bold flex flex-wrap items-center gap-2 break-words whitespace-normal leading-tight">
            {/* This logic splits the title by emojis. 
              Text parts get the gradient. 
              Emoji parts are rendered as normal spans to preserve color.
            */}
            {data.title.split(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu).map((part, index) => {
              const isEmoji = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu.test(part);
              return isEmoji ? (
                <span key={index} className="inline-block">
                  {part}
                </span>
              ) : (
                <span 
                  key={index} 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent [-webkit-background-clip:text]"
                >
                  {part}
                </span>
              );
            })}
          </h1>
          <p className="text-gray-400 text-sm group-hover:underline">
            @{data.profile?.username} • {new Date(data.created_at).toLocaleDateString()}
          </p>
        </Link>

        {/* Edit Button Section */}
        {isOwner && (
          <div className="flex items-center justify-center">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="group flex items-center justify-center gap-0 hover:gap-2 p-2 text-gray-500 hover:text-purple-500 hover:bg-white/5 rounded-full transition-all duration-300 ease-in-out"
            >
              <Edit fontSize="small" /> 
              <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-bold">
                Edit
              </span>
            </button>
          </div>
        )}
      </div>
      

      {/* Post Content with Image */}
      <div className="relative mb-6">
        {/* Main Post Image - Only show if image_url exists */}
        {data.image_url && (
          <div className="relative aspect-[4/3] md:aspect-video bg-gray-800 rounded-xl overflow-hidden mb-4">
            {data.image_url && !data.image_url.startsWith("blob:") ? (
              <img
                src={data.image_url}
                alt={data.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Image unavailable
              </div>
            )}
          </div>
        )}

        {/* UI Adaptation: Movie Tile positioning and backdrop-blur styling 
            refactored with AI assistance to ensure visibility regardless of 
            the post background. */}
        {/* Movie Tile - ALWAYS SHOWS if movie exists (MOVED OUTSIDE image block) */}
        {data.movie && (
          <div className="flex justify-center mb-6 pt-4">
            <button 
              onClick={() => setSelectedMovie(data.movie || null)}
              className="scale-125 shadow-lg shadow-purple-500/30rounded-xl p-3 bg-black/50 backdrop-blur-sm transition-transform">
              <MovieTile movie={data.movie} />
            </button>
          </div>
        )}

        {/* Post Text Content */}
        <div className="flex justify-center text-gray-300 whitespace-pre-line">
          {data.content}
        </div>
      </div>

      {/* Engagement */}
      <div className="flex items-center gap-6 mb-8">
        <LikeButton postId={postId} />
        <div className="flex items-center gap-2 text-gray-400">
          <span>💬</span>
          <span>{data.comment_count ?? 0} comments</span>
        </div>
      </div>

      {/* Comments Section */}
      <CommentSection postId={postId} />
      
      {/* Modal - Kept separate for a small file size */}
      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        postId={postId}
        initialTitle={data.title}
        initialContent={data.content}
        initialPhoto={data.image_url}
        onSave={() => queryClient.invalidateQueries({ queryKey: ["post", postId] })}
      />

      {/* Movie Detail Modal */}
      <MovieDetailModal 
        movie={selectedMovie}
        isOpen={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </div>
  );
};