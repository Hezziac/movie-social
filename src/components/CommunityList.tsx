 /* [CommunityList.tsx]
 * 
 * Contains community list component and fetchCommunities functions.
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

// ID is bigint (number in JS) and columns are title/description
export interface Community {
  id: number; 
  title: string; 
  description: string; 
  created_at: string;
}

export const fetchCommunities = async (): Promise<Community[]> => {
  const { data, error } = await supabase
    .from("communities")
    // Select the correct column names (title, description)
    .select("id, title, description, created_at") 
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
            {/* Placeholder image */}
            <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
              <span className="text-xl text-white/50">Genre Image</span>
            </div>
            
            <div className="p-4">
              <Link
                to={`/community/${community.id}`}
                className="text-2xl font-bold text-purple-500 hover:underline"
              >
                {/* Community Title */}
                {community.title}
              </Link>
              {/* Community Description */}
              <p className="text-gray-400 mt-2">{community.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
