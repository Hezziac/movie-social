/** [FollowersModal.tsx]
 * * A reusable modal component to display lists of followers or following users.
 * * * Note on AI Usage: 
 * - **Modal Logic**: AI assisted in implementing the FollowModal component's logic, ensuring it opens and closes correctly.
 * - **Styling**: AI helped with the Tailwind styling for the scrollable list and the "glassmorphism" close button.
 */
import { Link } from "react-router";

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
        
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found</div>
          ) : (
            users.map((user) => (
              <Link
                key={user.id}
                to={`/profile/${user.username}`}
                onClick={onClose}
                className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg transition-colors"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover" alt={user.username} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl">👤</div>
                )}
                <span className="text-white font-medium">@{user.username}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};