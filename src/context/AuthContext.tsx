import { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase-client";

interface AuthContextType {
  user: User | null;
  signInWithGitHub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleOAuthLogin = async (provider: "github" | "google") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });

      if (error?.message.includes("already registered")) {
        const originalProvider = error.message.split("'")[1]; // Extracts 'google' or 'github'
        
        // Prompt user to log in with original provider first
        const { error: originalError } = await supabase.auth.signInWithOAuth({
          provider: originalProvider as "github" | "google",
        });

        if (!originalError) {
          // Link the new provider after successful login
          await supabase.auth.linkIdentity({ provider });
        }
      }
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

  const signOut = () => {
    supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider 
      value={{ user, signInWithGitHub, signInWithGoogle, signOut }}
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