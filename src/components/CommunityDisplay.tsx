import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { PostItem } from "./PostItem";
import { Post } from "./PostList";

interface Props {
  communityId: number;
}

interface Community {
  id: number;
  title: string;
  description: string;
  image_url?: string | null;
}

interface PostWithCommunity extends Post {
  communities: {
    title: string;
  };
}

// 1. Separate fetch functions
const fetchCommunity = async (id: number): Promise<Community | null> => {
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    console.error("Community fetch error:", error);
    return null;
  }
  // DEBUG
  // console.log("DATA: ", data);
  return data;
};

const fetchCommunityPosts = async (
  id: number
): Promise<PostWithCommunity[]> => {
  const { data, error } = await supabase
    .from("posts")
    .select("*, communities(title), movie:movie_id (*)")
    .eq("community_id", Number(id)) // CAST NUMBER TO MATCH DB TYPE
    .order("created_at", { ascending: false });
  console.log("Joined DATA: ", data);
  if (error) throw error;
  return data || [];
};

export const CommunityDisplay = ({ communityId }: Props) => {
  // 2. Parallel fetch using Promise.all
  const { data, isLoading, error } = useQuery({
    queryKey: ["communityData", communityId],
    queryFn: () =>
      Promise.all([
        fetchCommunity(communityId),
        fetchCommunityPosts(communityId),
      ]),
    // Optional: Set stale time to prevent unnecessary refetches
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 3. Destructure the parallel results
  const [community, posts] = data || [null, []];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (error) return <div>Error loading data</div>;

  return (
    <div className="min-h-screen bg-black">
    {/* Hero Banner Section */}
    <div className="relative h-[300px] w-full flex items-center justify-center overflow-hidden mb-8">
      {/* Background Image Layer */}
      {community?.image_url ? (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url(${community.image_url})` }}
        />
      ) : (
        /* Fallback gradient if no image exists  */
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-black" />
      )}
      
      {/* Dark Overlay for Readability */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* Title Content Layer */}
      <div className="relative z-10 text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-2xl">
          {community?.title || `Community ${communityId}`}
        </h1>
        {community?.description && (
          <p className="text-gray-300 mt-4 max-w-2xl mx-auto text-lg md:text-xl">
            {community.description}
          </p>
        )}
      </div>
    </div>

    {/* Posts Section */}
    <div className="max-w-7xl mx-auto px-4">
      {posts.length > 0 ? (
        <div className="flex flex-wrap gap-6 justify-center">
          {posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-20 text-xl border border-white/5 rounded-xl bg-white/5">
          No posts in this community yet.
        </p>
      )}
    </div>
  </div>
  );
};
