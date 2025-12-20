 /* [AuthContext.tsx]
 * 
 * Contains the AuthContext and AuthProvider components for managing user authentication.
 * The context provides methods for signing in with GitHub or Google, and signing out.
 * It also manages the user state and loading state.
 * * * SOURCE ATTRIBUTION:
 * This file was originally based on:
 * [PedroTech Social Media Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)
 * * * Note on AI Usage: 
 * - **Redirection Debugging**: GitHub Copilot and Perplexity AI were instrumental 
 * in troubleshooting redirection bugs. AI helped me understand that 
 * navigation should happen at the component level rather than inside the 
 * AuthContext, leading to the removal of 'useNavigate' for a cleaner architecture.
 * - **Google Integration**: AI assisted in refactoring the 'handleOAuthLogin' 
 * function to support multiple providers (GitHub and Google) beyond the 
 * tutorial's original scope.
 * - **State Management**: Used AI to ensure the 'onAuthStateChange' listener was 
 * correctly handling session cleanups to prevent memory leaks.
 */
import { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase-client";
// Architectural Decision: Refactored with AI assistance to remove 
// 'useNavigate' from the Context. AI taught me that context should 
// manage state, while components handle navigation, resolving 
// several circular dependency bugs that were breaking my redirection.

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGitHub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // We remove the useNavigate hook from here.

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // The only job of this listener is to update the user and loading state.
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Initial check to set the user state immediately on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []); // The dependency array is now empty because it should only run once.

  // The rest of your functions are fine.
  const handleOAuthLogin = async (provider: "github" | "google") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) throw error;
    } catch (err) {
      console.error("OAuth error:", err);
    }
  };

  const signInWithGitHub = async () => {
    await handleOAuthLogin("github");
  };

  const signInWithGoogle = async () => {
    await handleOAuthLogin("google");
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // The onAuthStateChange listener will handle updating the user state to null.
      // We can also force a redirect here if needed.
      window.location.replace('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGitHub, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
