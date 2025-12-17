// src/context/AuthContext.tsx
import { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase-client";
// We no longer import useNavigate here because redirects should not happen in the context.

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
