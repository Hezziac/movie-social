/** [CreateHub.tsx]
 * 
 * * A custom navigation portal created to consolidate "Create" actions into 
 * a single view. This improves the UI by reducing Navbar clutter and 
 * providing a dedicated space for users to choose between creating content 
 * or communities.
 * * * * Note on AI Usage: 
 * - **Design & Layout**: GitHub Copilot and Perplexity AI assisted in the 
 * visual refactoring of this page. AI helped implement the responsive 
 * two-column grid and the interactive hover effects (scale-ups and border 
 * color transitions) using Tailwind CSS.
 * - **Iconography**: AI assisted in selecting and styling the appropriate 
 * Material UI icons (PostAdd and GroupAdd) to match the project's aesthetic.
 */

import { Link } from "react-router";
import { PostAdd, GroupAdd } from "@mui/icons-material";

export const CreateHub = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visual Refactoring: AI assisted in implementing these interactive 
            cards with conditional hover states (border-purple vs border-pink) 
            to differentiate between 'Post' and 'Community' actions. */}
        {/* Create Post Button */}
        <Link
          to="/create"
          className="group relative bg-gray-900 border border-white/10 p-8 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all hover:border-purple-500 hover:bg-gray-800"
        >
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
            <PostAdd fontSize="large" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white">Create Post</h3>
            <p className="text-gray-400 text-sm mt-1">Share a movie review or photo</p>
          </div>
        </Link>

        {/* Create Community Button */}
        <Link
          to="/community/create"
          className="group relative bg-gray-900 border border-white/10 p-8 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all hover:border-pink-500 hover:bg-gray-800"
        >
          <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
            <GroupAdd fontSize="large" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white">Create Community</h3>
            <p className="text-gray-400 text-sm mt-1">Start a new movie genre group</p>
          </div>
        </Link>
      </div>
    </div>
  );
};