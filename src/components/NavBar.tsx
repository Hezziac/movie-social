//NavBar.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router"; // Fixed import (use "react-router-dom" instead of "react-router")
import { useAuth } from "../context/AuthContext";
import {
  GitHub,
  Google,
  Menu,
  Close,
  AccountCircle,
} from "@mui/icons-material";
import { supabase } from "../supabase-client";
export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { signInWithGitHub, signInWithGoogle, signOut, user } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);

  const closeNav = () => {
    setMenuOpen(false);
  };

  // Fetch profile from Supabase if user is logged in
  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .single();
      if (!profileError && profileData) {
        setProfile(profileData);
      } else {
        setProfile(null);
      }
    };
    if (user?.id) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
    }
  }, [user]);

  // Display name for the user (username from profile or email)
  const displayName = profile?.username || user?.email;

  return (
    <nav className="fixed top-0 w-full z-40 bg-[rgba(10,10,10,0.8)] backdrop-blur-lg border-b border-white/10 shadow-lg h-16">
      <div className="max-w-5xl mx-auto px-4 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <Link to="/" className="font-mono text-xl font-bold text-white">
            Movie<span className="text-purple-500">.social</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Home
            </Link>

            <Link
              to="/communities"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Communities
            </Link>
            {user && (
            <>
            <Link
              to="/create"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Create Post
            </Link>
            
            <Link
              to="/community/create"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Create Community
            </Link>
            
          </>)}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Avatar and Display Name as link to profile */}
                <Link
                  to={profile?.username ? `/${profile.username}` : "/profile"}
                  className="flex items-center space-x-2 group"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full object-cover group-hover:ring-2 group-hover:ring-purple-500"
                    />
                  ) : (
                    <AccountCircle className="text-gray-300 text-2xl group-hover:text-purple-500" />
                  )}
                  <span className="text-gray-300 group-hover:text-purple-500">{displayName}</span>
                </Link>

                {/* Sign Out Button */}
                <button
                  onClick={signOut}
                  className="bg-red-500 px-3 py-1 rounded"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              /* Sign In Buttons - Now with Google */
              <div className="flex space-x-2">
                <button
                  onClick={signInWithGitHub}
                  className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded flex items-center"
                >
                  <GitHub className="w-4 h-4 mr-2" />
                  GitHub
                </button>
                <button
                  onClick={signInWithGoogle}
                  className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded flex items-center"
                >
                  <Google className="w-4 h-4 mr-2" />
                  Google
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button - updated */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="text-gray-300 focus:outline-none"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <Close className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - updated icons */}
      {menuOpen && (
        <div className="md:hidden bg-[rgba(10,10,10,0.9)]">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
              onClick={closeNav}
            >
              Home
            </Link>
            <Link
              to="/create"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
              onClick={closeNav}
            >
              Create Post
            </Link>
            <Link
              to="/communities"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
              onClick={closeNav}
            >
              Communities
            </Link>
            <Link
              to="/community/create"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
              onClick={closeNav}
            >
              Create Community
            </Link>
          </div>

          {/* Mobile Auth Section */}
          <div className="px-4 py-2 border-t border-white/10">
            {user ? (
              <div className="flex items-center space-x-4">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <AccountCircle className="text-gray-300 text-2xl" />
                )}
                <span className="text-gray-300">{displayName}</span>
                <button
                  onClick={signOut}
                  className="bg-red-500 px-3 py-1 rounded w-full mt-2 text-center text-white font-medium cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={signInWithGitHub}
                  className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded w-full flex items-center justify-center"
                >
                  <GitHub className="w-4 h-4 mr-2" />
                  Sign in with GitHub
                </button>
                <button
                  onClick={signInWithGoogle}
                  className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded w-full flex items-center justify-center"
                >
                  <Google className="w-4 h-4 mr-2" />
                  Sign in with Google
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
