// src/pages/ProfileSetupPage.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase-client";
import { useNavigate } from "react-router";

export function ProfileSetupPage() {
  console.log("Rendering: ProfileSetupPage"); // <-- DEBUG RENDERING PAGE
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const generateDefaultUsername = () => {
      return `MovieFan${Math.floor(1000 + Math.random() * 9000)}`;
    };

    if (initialLoad && user) {
      setUsername(generateDefaultUsername());
      setInitialLoad(false);

      // Now we re-enable this check to redirect users who already have a profile.
      supabase
        .from("profiles")
        .select("username") // We need the username to redirect to a dynamic URL
        .eq("id", user.id)
        .single()
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
      console.log("No user session found");
      return;
    }
    
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError(
        "Username must be 3-20 characters (letters, numbers, underscores)"
      );
      console.log(
        "Username must be 3-20 characters (letters, numbers, underscores)"
      );
      return;
    }
    
    try {
      const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .eq("username", username);

      console.log("Count: ", count);

      if (count && count > 0) {
        setError("Username is already taken");
        return;
      }
      
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        username,
        bio,
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
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Complete Setup
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
