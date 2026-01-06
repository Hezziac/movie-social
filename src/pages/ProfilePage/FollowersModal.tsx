/** [FollowersModal.tsx]
 * * A reusable modal component to display lists of followers or following users.
 * * * Note on AI Usage: 
 * - **Modal Logic**: AI assisted in implementing the FollowModal component's logic, ensuring it opens and closes correctly.
 * - **Styling**: AI helped with the Tailwind styling for the scrollable list and the "glassmorphism" close button.
 */
import { Link } from "react-router";
import { AccountCircle } from "@mui/icons-material";
import { useState } from "react";

interface FollowUser {
  id: string;
  username: string;
  avatar_url: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: FollowUser[];
}

// Small helper component to handle individual avatar error states
const UserAvatar = ({ user }: { user: FollowUser }) => {
  const [imgError, setImgError] = useState(false);

  // If there is no URL at all OR the image failed to load (404)
  if (!user.avatar_url || imgError) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-white/10 flex-shrink-0">
        <AccountCircle className="text-gray-500" sx={{ fontSize: 32 }} />
      </div>
    );
  }

  return (
    <img
      src={user.avatar_url}
      className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
      alt={user.username}
      onError={() => setImgError(true)} // 👈 This catches the 404
    />
  );
};

export const FollowModal = ({ isOpen, onClose, title, users }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <div className="relative bg-gray-900 border border-gray-800 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-white font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AccountCircle sx={{ fontSize: 48, opacity: 0.2 }} />
              <p className="mt-2">No users found</p>
            </div>
          ) : (
            users.map((user) => (
              <Link
                key={user.id}
                to={`/profile/${user.username}`}
                onClick={onClose}
                className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all group"
              >
                <UserAvatar user={user} />
                <div className="flex flex-col">
                  <span className="text-white font-medium group-hover:text-purple-400 transition-colors">
                    {user.username}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">View Profile</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};