 /* [CommunityDisplay.tsx]
 * 
 * Contains communitydisplay component, which fetches and displays a community's
 * information and posts. It uses React Query for data fetching and Supabase for
 * database interactions.
 * * * SOURCE ATTRIBUTION:
 * This entire file was originally provided by the following tutorial:
 * [PedroTech Social Media Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)
 * I have adapted the code specifically to match my project's Supabase data structure
 * and TypeScript requirements.
 * * * Note on AI Usage: 
 * GitHub Copilot and Perplexity AI were used only to assist in refactoring the 
 * inherited logic to match my specific database schema and to resolve 
 * TypeScript syntax errors encountered during the adaptation and design.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { PostItem } from "./PostItem";
import { Post } from "./PostList";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { EditCommunityModal } from "./EditCommunityModal";
import { ChatBubbleOutline, Settings } from "@mui/icons-material";
import { useQueryClient } from "@tanstack/react-query";
import { SignInModal } from "./SignInModal";
import { CommunityChatDrawer} from "./CommunityChat/CommunityChatDrawer";

interface Props {
  communityId: number;
}

interface Community {
  id: number;
  title: string;
  description: string;
  image_url?: string | null;
  creator_id: string;
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

const fetchCommunityPosts = async (id: number): Promise<PostWithCommunity[]> => {
  const { data, error } = await supabase
    .rpc("get_posts_with_counts", { 
       community_id_filter: id 
    });

  if (error) throw error;
  return data || [];
};

// FETCH membership status 
const fetchMembershipStatus = async (communityId: number, userId: string | undefined) => {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("community_members")
    .select("*")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();
  
  if (error) return null;
  return data;
};

export const CommunityDisplay = ({ communityId }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 2. Parallel fetch using Promise.all
  const { data, isLoading, error } = useQuery({
    queryKey: ["communityData", communityId, user?.id], // Add user?.id to key so it refetches on login/logout
    queryFn: () =>
      Promise.all([
        fetchCommunity(communityId),
        fetchCommunityPosts(communityId),
        fetchMembershipStatus(communityId, user?.id), // New fetch
      ]),
    // Optional: Set stale time to prevent unnecessary refetches
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 3. Destructure the THREE results
  const [community, posts, membership] = data || [null, [], null];

  // Mutation for Joining/Leaving
  const toggleJoin = async () => {
    if (!user) {
      setIsAuthModalOpen(true); // Open the modal
      return;
    }

    if (membership) {
      // Already a member -> Leave
      await supabase.from("community_members").delete().eq("id", membership.id);
    } else {
      // Not a member -> Join
      await supabase.from("community_members").insert({
        user_id: user.id,
        community_id: communityId,
      });
    }
    // Tell React Query to refresh the data
    queryClient.invalidateQueries({ queryKey: ["communityData", communityId] });
  };

  // community ownership
  const isOwner = user && community && user.id === community.creator_id;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const isMember = !!membership;
  const userRole = membership?.role || 'member';
  if (error) return <div>Error loading data</div>;

  return (
    <div className="min-h-screen bg-black">
    {/* Hero Banner Section: Custom UI design implemented with 
        Tailwind CSS, utilizing AI to assist with the 
        background overlay and blur effects. */}
    <div className="relative h-[450px] w-full flex items-center justify-center overflow-hidden mb-8">
      {/* Background Layers */}
      {community?.image_url ? (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url(${community.image_url})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-black" />
      )}
      
      {/* Dark Overlay for Readability */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* Edit Community Button (Only visible to owner) */}
      {isOwner && (
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="absolute top-6 right-6 z-20 bg-black/40 hover:bg-purple-600 text-white p-2 rounded-full backdrop-blur-md border border-white/10 transition-all"
        >
          <Settings />
        </button>
      )}

      {/* Title Content Layer */}
      <div className="relative z-10 text-center px-4 flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-2xl leading-tight py-2">
          {community?.title || `Community ${communityId}`}
        </h1>

        {/* Join / Creator Badge */}
        <div className="mt-4">
          {!isOwner ? (
            <button
              onClick={toggleJoin}
              className={`px-8 py-2 rounded-full font-bold transition-all duration-300 transform hover:scale-105 border-2 ${
                membership
                  ? "bg-transparent border-gray-500 text-gray-400 hover:border-red-500 hover:text-red-500"
                  : "bg-purple-600 border-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              {membership ? "Leave Community" : "Join Community"}
            </button>
          ) : (
            <div className="px-8 py-2 rounded-full font-bold bg-purple-900/50 border border-purple-400 text-purple-300">
              Community Creator
            </div>
          )}
        </div>

        {/* Description */}
        {community?.description && (
          <p className="text-gray-300 mt-6 max-w-2xl mx-auto text-base md:text-lg leading-relaxed line-clamp-3">
            {community.description}
          </p>
        )}

        {/* 💬 NEW INTEGRATED CHAT BUTTON */}
        {isMember && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="mt-6 flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full text-white transition-all duration-300 group"
          >
            <ChatBubbleOutline className="text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm">Community Chat</span>
          </button>
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
    
    {/* 🚀 THE DRAWER COMPONENT */}
    <CommunityChatDrawer 
      isOpen={isChatOpen} 
      onClose={() => setIsChatOpen(false)} 
      communityId={communityId}
      communityName={community?.title || "Community"}
      userRole={userRole} 
    />

    <SignInModal 
      isOpen={isAuthModalOpen} 
      onClose={() => setIsAuthModalOpen(false)} 
      actionName="join communities"
    />
    {community && (
        <EditCommunityModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          community={community}
          onSave={() => queryClient.invalidateQueries({ queryKey: ["communityData", communityId] })}
        />
      )}
  </div>
  );
};
