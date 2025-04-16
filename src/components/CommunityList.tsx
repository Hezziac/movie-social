import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { Link } from "react-router";

export interface Community {
  id: number;
  name: string;
  description: string;
  created_at: string;
}
export const fetchCommunities = async (): Promise<Community[]> => {
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Community[];
};

export const CommunityList = () => {
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
            {community.name}
          </Link>
          <p className="text-gray-400 mt-2">{community.description}</p>
        </div>
      </div>
    ))}
  </div>
</div>
  );
};
