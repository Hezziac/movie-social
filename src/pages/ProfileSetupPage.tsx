/** [ProfileSetupPage.tsx]
 * 
 * * A custom-built onboarding page designed to force new users to establish a 
 * unique username and bio before accessing the main feed.
 * * * * Note on AI Usage: 
 * - **Onboarding Architecture**: I conceptualized this "onboarding gate" to 
 * improve user identity. AI helped me structure the logic that redirects 
 * existing users away from this page if their profile is already complete.
 * - **Debugging Redirect Loops**: GitHub Copilot and Perplexity AI were 
 * instrumental in fixing a bug where this page wouldn't load or would loop 
 * infinitely. AI helped me implement the 'initialLoad' state and the 
 * '.single()' query to check for existing profiles correctly. (switch to .maybeSingle() after adding url upload to signup flow)
 * - **Username Implementation**: I came up with the idea to auto-generate a 
 * random placeholder username to reduce signup friction. I used AI to help 
 * write the specific JavaScript logic for 'generateDefaultUsername' and to 
 * ensure the 'upsert' command worked correctly with Supabase.
 * - **Validation**: AI assisted in the regex implementation to ensure 
 * usernames meet database requirements and prevent SQL-level errors.
 */

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase-client";
import { useNavigate } from "react-router";
import { AvatarUpload } from "./ProfilePage/AvatarUpload";

export function ProfileSetupPage() {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [initialLoad, setInitialLoad] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    // UX Logic: I decided to implement an automatic username generator to 
    // help users get started faster. I used AI to help me write this function 
    // and integrate it with the component's state.
    const generateDefaultUsername = () => {
      return `MovieFan${Math.floor(1000 + Math.random() * 9000)}`;
    };

    if (initialLoad && user) {
      setUsername(generateDefaultUsername());
      setInitialLoad(false);

      // Security/Navigation Logic: Refactored with AI to prevent a redirect loop. 
      // This check ensures that if a user already has a profile, they are 
      // automatically sent to their dashboard instead of seeing the setup form again.
      supabase
        .from("profiles")
        .select("username, avatar_url") // We need the username to redirect to a dynamic URL
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data && data.username) {
            navigate(`/profile/${data.username}`);
          }
        });
      console.log("initialLoad && user");
    }
  }, [user, initialLoad, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("No user session found");
      return;
    }
    
    // Username Validation
    // Updated Regex to allow dots '.' 
    // This allows alphanumeric, underscores, and dots, but ensures it's 3-20 chars.
    if (!/^[a-zA-Z0-9._]{3,20}$/.test(username)) {
      setError(
        "Username must be 3-20 characters (letters, numbers, underscores '_', or dots '.')"
      );
      return;
    }
    
    try {
      // Check if username is taken
      const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .eq("username", username);

      if (count && count > 0) {
        setError("Username is already taken");
        return;
      }
      
      // Save Profile
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        username,
        bio,
        avatar_url: avatarUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // After successful profile creation, redirect to the dynamic URL
      navigate(`/profile/${username}`);
    } catch (err) {
      console.error("Profile creation error:", err);
      setError("Failed to create profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-gray-900 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Complete Your Profile
          </h2>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* 4. The Avatar Upload Section */}
            <div className="flex flex-col items-center pb-4 border-b border-white/5">
              <label className="block text-gray-400 text-sm font-bold uppercase mb-4 tracking-wider">Profile Picture</label>
              <AvatarUpload 
                uid={user?.id || ""} 
                url={avatarUrl} 
                onUpload={(_event, filePath) => setAvatarUrl(filePath)} 
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Bio (optional)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none h-32"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-purple-500/20"
            >
              Start Exploring
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
