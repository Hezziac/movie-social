// src/pages/ProfilePage.tsx
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useParams } from "react-router";
import { useProfileData } from "./useProfileData";
import { ProfileEditForm } from "./ProfileEditForm";


export function ProfilePage() {
  console.log("Rendering: ProfilePage"); // <-- DEBUG RENDERING PAGE
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const { username } = useParams<{ username: string }>();
  const {
    profile,
    userPosts,
    stats,
    loading,
    loadProfileAndPosts,
} = useProfileData(username);

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
              {profile.avatar_url && !profile.avatar_url.startsWith("blob:") ? (
                <img src={profile.avatar_url} alt={`${profile.username}'s avatar`} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <span className="text-gray-400">👤</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden flex items-center justify-center bg-gray-800 border-2 border-purple-600 flex-shrink-0">
              <span className="text-3xl md:text-5xl text-gray-400">👤</span>
            </div>
          )}
          
          {/* Profile Info */}
          <div className="flex-1">
            {/* Username and Edit Button */}
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-xl font-bold text-white">{profile.username}</h1>
              {user && user.id === profile.id && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gray-800 text-white text-sm px-4 py-1.5 rounded-lg border border-gray-700 hover:bg-gray-700"
                >
                  Edit Profile
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
                <span className="text-white font-bold">{stats.followers}</span>{" "}
                <span className="text-gray-400">followers</span>
              </div>
              <div>
                <span className="text-white font-bold">{stats.following}</span>{" "}
                <span className="text-gray-400">following</span>
              </div>
            </div>
            
            {/* Bio */}
            <p className="text-white">{profile.bio || "No bio yet"}</p>
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

        {/* Content Tabs */}
        <div className="border-t border-gray-800 mt-4">
          <div className="flex">
            <button className="flex-1 py-3 text-center border-t-2 border-purple-600 text-purple-600 font-medium">
              POSTS
            </button>
            <button className="flex-1 py-3 text-center text-gray-500 font-medium">
              MOVIES
            </button>
          </div>
        </div>

        {/* Posts Grid */}
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
                  post.image_url.startsWith("blob:") ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-500">Image unavailable</span>
                    </div>
                  ) : (
                    <img 
                      src={post.image_url} 
                      alt={post.content} 
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
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
      </div>
    </div>
  );
}
