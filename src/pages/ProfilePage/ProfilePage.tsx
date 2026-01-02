/** [ProfilePage.tsx]
 * 
 * * * A custom-built profile view that serves as the user's home base. It features 
 * a professional "Instagram-inspired" layout including profile stats, 
 * bio management, and a responsive media grid.
 * * * * Note on AI Usage: 
 * - **UI/UX Design**: GitHub Copilot and Perplexity AI were instrumental in 
 * achieving the specific "Instagram look." AI assisted in implementing the 
 * CSS-grid logic for the 3-column post layout and the hover-overlay effects 
 * showing like/comment counts.
 * - **State Orchestration**: AI helped refactor this page to use a custom hook 
 * (`useProfileData`) to separate the data-fetching logic from the presentation layer.
 * - **Refactoring**: AI assisted in implementing the conditional logic for the 
 * "Edit Profile" vs "Follow" button based on the logged-in user's relationship 
 * to the profile being viewed.
 */
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useParams } from "react-router";
import { useProfileData } from "./useProfileData";
import { ProfileEditForm } from "./ProfileEditForm";
import { FollowModal } from "./FollowersModal";
import { MovieDetailModal } from "../../components/MovieDetailModal";


export function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const { username } = useParams<{ username: string }>();
  const {
    profile,
    userPosts,
    stats,
    loading,
    loadProfileAndPosts,
    isFollowing,
    toggleFollow,
    favoriteMovies,
} = useProfileData(username);
  const [followModal, setFollowModal] = useState<{ open: boolean; title: string; users: any[] }>({
    open: false,
    title: "",
    users: [],
  });
  const [activeTab, setActiveTab] = useState<"posts" | "movies">("posts");
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);

  // This will only render the spinner if
  // `loading` is true OR `profile` is null. The changes above ensure that
  // if `profile` is null, the user is redirected before this check can cause a loop.
  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          {/* Profile Picture */}
          {profile.avatar_url ? (
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden flex-shrink-0">
            <img src={profile.avatar_url} alt={`${profile.username}'s avatar`} className="w-full h-full rounded-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden flex items-center justify-center bg-gray-800 border-2 border-purple-600 flex-shrink-0">
              <span className="text-3xl md:text-5xl text-gray-400">👤</span>
            </div>
          )}
          
          {/* Profile Info */}
          <div className="flex-1">
            {/* Relationship Logic: Refactored with AI to dynamically toggle 
                between 'Edit Profile' (for the owner) and 'Follow/Unfollow' 
                (for visitors), ensuring a secure and personalized experience. */}
            {/* Username and Edit Button */}
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-xl font-bold text-white">{profile.username}</h1>

              {user && user.id === profile.id ? (
                !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gray-800 text-white text-sm px-4 py-1.5 rounded-lg border border-gray-700 hover:bg-gray-700"
                  >
                    Edit Profile
                  </button>
                )
              ) : (
                <button
                  onClick={() => toggleFollow(user?.id, profile.id)}
                  className={`px-6 py-1.5 rounded-lg font-medium transition ${
                    isFollowing
                      ? "bg-gray-800 text-white border border-gray-700 hover:bg-red-900/20 hover:text-red-500 hover:border-red-500"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>
            
            {/* Stats */}
            <div className="flex gap-6 mb-4">
              <div>
                <span className="text-white font-bold">{stats.posts}</span>{" "}
                <span className="text-gray-400">posts</span>
              </div>
              <div>
                {/* Followers Button */}
                <button 
                  onClick={() => setFollowModal({ open: true, title: "Followers", users: profile.followers_data || [] })}
                  className="hover:opacity-70 transition"
                >
                  <span className="text-white font-bold">{stats.followers}</span>{" "}
                  <span className="text-gray-400">followers</span>
                </button>
              </div>
              <div>
                {/* Following Button */}
                <button 
                  onClick={() => setFollowModal({ open: true, title: "Following", users: profile.following_data || [] })}
                  className="hover:opacity-70 transition"
                >
                  <span className="text-white font-bold">{stats.following}</span>{" "}
                  <span className="text-gray-400">following</span>
                </button>
              </div>
            </div>
            
            {/* Bio */}
            <p className="text-white text-sm md:text-base whitespace-pre-wrap break-words">{profile.bio || "No bio yet"}</p>
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing ? (
          <ProfileEditForm
            profile={profile} // Pass the profile data from the hook
            user={user}       // Pass the logged-in user from useAuth
            onSave={() => {
              setIsEditing(false);
              loadProfileAndPosts(); // Call the function from the hook to re-fetch data
            }}
            onCancel={() => setIsEditing(false)}
            />
        ) : null}

        {/* Content Tabs Refactored */}
        <div className="border-t border-gray-800 mt-4">
          <div className="flex">
            <button 
              onClick={() => setActiveTab("posts")}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === "posts" 
                ? "border-t-2 border-purple-600 text-purple-600" 
                : "text-gray-500 hover:text-gray-300"
              }`}
            >
              POSTS
            </button>
            <button 
              onClick={() => setActiveTab("movies")}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === "movies" 
                ? "border-t-2 border-purple-600 text-purple-600" 
                : "text-gray-500 hover:text-gray-300"
              }`}
            >
              MOVIES
            </button>
          </div>
        </div>

        {/* Posts Grid: Implemented with AI assistance to achieve a 
            responsive 3-column layout. It includes a fallback render for 
            text-only posts and a hover-state overlay for engagement metrics. */}
        {activeTab === "posts" ? (
          <>
        {userPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4 text-2xl">
              📷
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Posts Yet</h3>
            <p className="text-gray-400 text-center">
              When you share photos and videos, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 mt-4">
            {userPosts.map((post) => (
              <Link to={`/post/${post.id}`} key={post.id} className="relative aspect-square bg-gray-800 group">
              {/* Post Image */}
                {post.image_url ? (
                  <img 
                    src={post.image_url} 
                    alt={post.content} 
                    className="w-full h-full object-cover"
                    />
                  ) : (
                  /* 2. Fallback: Display Title and Content only if no image */
                  <div className="w-full h-full p-3 flex flex-col bg-gradient-to-b from-gray-800 to-black items-center justify-center">
                    <h4 className="text-white text-xs md:text-sm font-bold line-clamp-2 mb-1">
                      {post.title || "Untitled"}
                    </h4>
                    <p className="text-gray-400 text-[10px] md:text-xs line-clamp-9 leading-snug">
                      {post.content}
                    </p>
                    <div className="mt-auto self-end opacity-30 text-xl">📄</div>
                  </div>
                )}

                {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-4 text-white">
                      <div className="flex items-center">
                        <span className="mr-1">❤️</span>
                        <span>{post.votes?.length ? post.votes[0].count : 0}</span>
                      </div>
                    <div className="flex items-center">
                        <span className="mr-1">💬</span>
                        <span>{post.comments?.length ? post.comments[0].count : 0}</span>
                    </div>
                  </div>
                </div>

                {/* Movie Badge */}
                {post.movie && (
                <div className="absolute top-2 left-2 bg-purple-600 rounded px-2 py-0.5 text-xs text-white shadow">
                  Movie
                </div>
                )}
              </Link>
            ))}
          </div>
        )}
        </>
        ) : ( 
          <div className="mt-4">
            {favoriteMovies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4 text-2xl">
                  🎬
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No Favorites Yet</h3>
                <p className="text-gray-400">Movies you favorite will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {favoriteMovies.map((movie) => (
                  <div key={movie.id} className="relative aspect-[2/3] bg-gray-900 rounded-lg overflow-hidden border border-white/5 group shadow-lg">
                    <div 
                      key={movie.id} 
                      onClick={() => setSelectedMovie(movie)} // Triggers popup
                      className="relative aspect-[2/3] bg-gray-900 rounded-lg overflow-hidden border border-white/5 group shadow-lg cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
                    >
                      <img 
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <p className="text-white text-[10px] md:text-xs font-bold truncate">{movie.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <MovieDetailModal 
        movie={selectedMovie}
        isOpen={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
      
      <FollowModal 
        isOpen={followModal.open}
        onClose={() => setFollowModal({ ...followModal, open: false })}
        title={followModal.title}
        users={followModal.users}
      />
    </div>
  );
}
