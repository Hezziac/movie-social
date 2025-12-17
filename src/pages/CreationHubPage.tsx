import { Link } from "react-router";
import { PostAdd, GroupAdd } from "@mui/icons-material";

export const CreateHub = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
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