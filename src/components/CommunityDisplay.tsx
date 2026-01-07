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
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { EditCommunityModal } from "./EditCommunityModal";
import { ChatBubbleOutline, Settings, NotificationsActive, NotificationsOff } from "@mui/icons-material";
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
  
  // 1. Get the actual membership row
  const { data: membershipData, error } = await supabase
    .from("community_members")
    .select("*")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();
  
  if (error || !membershipData) return null;

  // 2. Check for unread notifications (this doesn't change your membership data)
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", userId)
    .eq("target_id", communityId.toString())
    .eq("type", "community_chat")
    .eq("is_read", false);

  // 3. Return both pieces of info in one object
  return {
    ...membershipData,
    hasUnread: (count ?? 0) > 0
  };
};

export const CommunityDisplay = ({ communityId }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUpdatingNotifs, setIsUpdatingNotifs] = useState(false);
  
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

  // Toggle Chat Notifications
  const toggleNotifications = async () => {
    if (!membership || isUpdatingNotifs) return;
    setIsUpdatingNotifs(true);

    const newValue = !membership.chat_notifications_enabled;

    const { error } = await supabase
      .from("community_members")
      .update({ chat_notifications_enabled: newValue })
      .eq("id", membership.id);

    if (!error) {
      // Refresh data to show new icon state
      queryClient.invalidateQueries({ queryKey: ["communityData", communityId] });
    }
    setIsUpdatingNotifs(false);
  };

  // CHAT DRAWER STATE
  useEffect(() => {
    if (isChatOpen) {
      // Save the current scroll position so the page doesn't jump to the top
      const scrollY = window.scrollY;
      
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'hidden';
    } else {
      // When closing, retrieve the saved scroll position
      const scrollY = document.body.style.top;
      
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      
      // Scroll the window back to where the user was
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
    };
  }, [isChatOpen]);
  
  useEffect(() => {
    if (isChatOpen && user) {
      const markAsRead = async () => {
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", user.id)
          .eq("target_id", communityId.toString())
          .eq("type", "community_chat");
        
        // Refresh the data to hide the red dot
        queryClient.invalidateQueries({ queryKey: ["communityData", communityId] });
      };
      markAsRead();
    }
  }, [isChatOpen, user, communityId]);

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
          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-2 px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full text-white transition-all duration-300 group"
            >
              <ChatBubbleOutline className="text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm">Community Chat</span>
              {/* 🔴 RED DOT WITH ANIMATE PING */}
              {membership?.hasUnread && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-black"></span>
                </span>
              )}
           </button>

            {/* 🔔 Notification Toggle Button */}
            <button
              onClick={toggleNotifications}
              disabled={isUpdatingNotifs}
              className={`p-2 rounded-full border backdrop-blur-md transition-all ${
                membership.chat_notifications_enabled 
                  ? "bg-purple-600/20 border-purple-500/50 text-purple-400 hover:bg-purple-600/40" 
                  : "bg-gray-800/40 border-white/10 text-gray-500 hover:text-gray-300"
              }`}
              title={membership.chat_notifications_enabled ? "Mute Chat" : "Unmute Chat"}
            >
              {membership.chat_notifications_enabled ? <NotificationsActive fontSize="small" /> : <NotificationsOff fontSize="small" />}
            </button>
          </div>
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
