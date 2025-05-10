import { Link } from "react-router";
import { Post } from "./PostList";

interface Props {
  post: Post;
}

export const PostItem = ({ post }: Props) => {
  return (
    <div className="relative group w-80">
      <div className="absolute -inset-1 rounded-[20px] bg-gradient-to-r from-pink-600 to-purple-600 blur-sm opacity-0 group-hover:opacity-50 transition duration-300 pointer-events-none"></div>
      <Link to={`/post/${post.id}`} className="block relative z-10 h-full">
        <div className="h-full bg-[rgb(24,27,32)] border border-[rgb(84,90,106)] rounded-[20px] text-white flex flex-col p-5 overflow-hidden transition-colors duration-300 group-hover:bg-gray-800">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            {post.avatar_url ? (
              <img
                src={post.avatar_url}
                alt="User Avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tl from-[#8A2BE2] to-[#491F70]" />
            )}
            <h3 className="font-semibold truncate">{post.title}</h3>
          </div>

          {/* Image with potential movie tile */}
          <div className="relative flex-1 mb-3 rounded-xl overflow-hidden">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-full max-h-48 object-cover"
            />
            {post.movie && (
              <div className="absolute bottom-2 left-2">
                <div className="w-16 h-20 bg-gray-900/80 rounded-md overflow-hidden border border-gray-700">
                  {post.movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${post.movie.poster_path}`}
                      alt={post.movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-1">
                      <p className="text-xs text-center text-gray-400 truncate">
                        {post.movie.title}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Engagement metrics */}
          <div className="flex justify-between text-sm text-gray-400">
            <span>❤️ {post.like_count ?? 0}</span>
            <span>💬 {post.comment_count ?? 0}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};