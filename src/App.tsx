import { Route, Routes, useNavigate } from "react-router";
import { Home } from "./pages/Home";
import { Navbar } from "./components/NavBar";
import { CreatePostPage } from "./pages/CreatePostPage";
import { PostPage } from "./pages/PostPage";
import { CreateCommunityPage } from "./pages/CreateCommunityPage";
import { CommunitiesPage } from "./pages/CommunitiesPage";
import { CommunityPage } from "./pages/CommunityPage";
import MovieSearchPage from "./pages/MovieSearchPage";
import { CreateHub } from "./pages/CreationHubPage";
import { useAuth } from "./context/AuthContext";
import { JSX, useEffect, useState } from "react";
import { ProfileSetupPage } from "./pages/ProfileSetupPage";
import { ProfilePage } from "./pages/ProfilePage/ProfilePage";
import { EmergencyLogoutPage } from "./pages/EmergencyLogoutPage";
import { supabase } from "./supabase-client";

// This is the new, leaner ProtectedRoute. Its only job is to check for a logged-in user.
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If the app is not loading and there is no user, redirect to the home page.
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);
  
  // If a user is logged in, show the child component.
  // If not, the useEffect above will handle the redirect.
  return user ? children : null;
};

// This new component centralizes all the routing logic, but does not use ProtectedRoute
// directly. We will now handle this with the routes themselves.
const AppRoutes = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && user) {
      // This is the single, centralized check for a profile.
      supabase.from("profiles").select("id").eq("id", user.id).single()
        .then(({ data }) => {
          setHasProfile(!!data);
          // Redirect a new user to the profile setup page.
          if (!data) {
            navigate("/profile-setup");
          }
        });
    } else if (!loading && !user) {
      setHasProfile(false);
    }
  }, [user, loading, navigate]);

  // We are keeping this loading state here to ensure a smooth transition.
  if (loading || (user && hasProfile === null)) {
    return <div className="text-white p-4">Loading...</div>;
  }

  return (
    <Routes>
      {/* Public routes that anyone can visit */}
      <Route path="/" element={<Home />} />
      <Route path="/post/:id" element={<PostPage />} />
      <Route path="/communities" element={<CommunitiesPage />} />
      <Route path="/community/:id" element={<CommunityPage />} />
      <Route path="/movies/search" element={<MovieSearchPage />} />

      {/* This is the public-facing profile page. It is not wrapped. */}
      <Route path="/profile/:username" element={<ProfilePage />} />

      {/* Catch-all for Vite base path */}
      <Route path="/movie-social" element={<Home />} />
      <Route path="/movie-social/*" element={<Home />} />

      {/* Protected routes that only logged-in users can access */}
      <Route path="/create-hub" element={<ProtectedRoute><CreateHub /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
      <Route path="/community/create" element={<ProtectedRoute><CreateCommunityPage /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><MovieSearchPage /></ProtectedRoute>} />

      {/* This is a special route for new users. It is also protected. */}
      <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetupPage /></ProtectedRoute>} />

      {/* This is the emergency logout route. It is not protected. */}
      <Route path="/logout-emergency" element={<EmergencyLogoutPage />} />
    </Routes>
  );
};

function App() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
      ></meta>
      <Navbar />
      <div className="pt-16">
        <AppRoutes />
      </div>
    </div>
  );
}

export default App;
