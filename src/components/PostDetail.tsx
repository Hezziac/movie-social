// PostDetail.tsx
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { Post } from "./PostList";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";
import { MovieTile } from "./MovieTile"; // New component we'll create
import { Movie } from "../context/tmdb-client";

interface Props {
  postId: number;
}

const fetchPostById = async (id: number): Promise<Post & { movie?: Movie }> => {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      movie:movie_id (*)
    `)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const PostDetail = ({ postId }: Props) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => fetchPostById(postId),
  });

  if (isLoading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error.message}</div>;
  if (!data) return <div>Post not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Post Header */}
      <div className="flex items-center gap-4 mb-6">
        {data.avatar_url ? (
          <img
            src={data.avatar_url}
            alt="User avatar"
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500" />
        )}
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            {data.title}
          </h1>
          <p className="text-gray-400 text-sm">
            {new Date(data.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Post Content with Image */}
      <div className="relative mb-6">
        {/* Main Post Image */}
        <div className="relative aspect-[4/3] md:aspect-video bg-gray-800 rounded-xl overflow-hidden">
          <img
            src={data.image_url}
            alt={data.title}
            className="w-full h-full object-cover"
          />
          
          {/* Movie Tile (if exists) */}
          {data.movie && (
            <div className="absolute bottom-4 left-4 z-10">
              <MovieTile movie={data.movie} />
            </div>
          )}
        </div>

        {/* Post Text Content */}
        <div className="mt-4 text-gray-300 whitespace-pre-line">
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
    </div>
  );
};