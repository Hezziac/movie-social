import { Google } from "@mui/icons-material";
import { supabase } from "../supabase-client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionName: string; // e.g., "join communities" or "like posts"
}

export const AuthModal = ({ isOpen, onClose, actionName }: AuthModalProps) => {
  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Google className="text-purple-400 text-3xl" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">Login Required</h3>
        <p className="text-gray-400 mb-8">
          You need to be signed in to {actionName}. It only takes a second!
        </p>

        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-200 transition"
          >
            <Google />
            Continue with Google
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-transparent text-gray-400 font-medium hover:text-white transition"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};