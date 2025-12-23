 /* [CommunityList.tsx]
 * 
 * Contains community list component and fetchCommunities functions and display.
 * * * SOURCE ATTRIBUTION:
 * This entire file was originally provided by the following tutorial:
 * [PedroTech Social Media Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)
 * I have adapted the code specifically to match my project's Supabase data structure
 * and TypeScript requirements.
 * * * Note on AI Usage: 
 * GitHub Copilot and Perplexity AI were used only to assist in refactoring the 
 * code to fit my database schema and to ensure TypeScript compatibility.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { Link } from "react-router";

// ID is bigint (number in JS) and columns are (id, title, description, created_at)
export interface Community {
  id: number; 
  title: string; 
  description: string; 
  created_at: string;
  image_url?: string | null;
}

export const fetchCommunities = async (): Promise<Community[]> => {
  const { data, error } = await supabase
    .from("communities")
    // Select the correct column names (title, description etc.)
    .select("id, title, description, created_at, image_url") 
    // CRITICAL: Filter by type='public' to satisfy RLS for public display
    .eq('type', 'public') 
    .order("created_at", { ascending: false });

    console.log("Fetched communities:", { data, error });

  if (error) throw new Error(error.message);
  return data as Community[];
};

export const CommunityList = () => {
  // Assuming the pathing for the imports is correct for your file structure
  const { data, error, isLoading } = useQuery<Community[], Error>({
    queryKey: ["communities"],
    queryFn: fetchCommunities,
  });

  if (isLoading)
    return <div className="text-center py-4">Loading communities...</div>;
  if (error)
    return (
      <div className="text-center text-red-500 py-4">
        Error: {error.message}
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-8 bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700/30 shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.map((community) => (
          <div
            key={community.id}
            className="border border-white/10 rounded-lg hover:-translate-y-1 transition-transform overflow-hidden bg-gray-900/70 backdrop-blur-sm"
          >
            {/* Community image */}
          <Link
            to={`/community/${community.id}`}
            className="text-2xl font-bold text-purple-500 hover:lift-1 group transition-transform duration-500"
          >
            <div className="h-48 relative overflow-hidden">
              {community.image_url ? (
                <img 
                  src={community.image_url} 
                  alt={community.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                /* Fallback if no image exists */
                <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-black flex items-center justify-center">
                  <span className="text-white/30 text-4xl">🎬</span>
                </div>
              )}
              {/* Dark Gradient Overlay for professional look */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            
            <div className="p-4">
                {/* Community Title */}
                {community.title}
              {/* Community Description */}
              <p className="text-gray-400 mt-2 text-sm line-clamp-2 h-10">{community.description || `${community.title} Community`}</p>
            </div>
          </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
