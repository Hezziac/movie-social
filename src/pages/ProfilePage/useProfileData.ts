// useProfileData.ts for fetching data on profile page 
import { useEffect, useState } from "react";
import { supabase } from "../../supabase-client"; // Adjust path if your supabase-client is elsewhere
import { useAuth } from "../../context/AuthContext";
import { Post } from "../../components/PostList"; // Import the base Post interface

// Define an interface for the extended post data returned by Supabase.
// This is needed here as this is where the fetching happens.
export interface PostWithRelations extends Post {
    votes: { count: number }[]; // Matches 'votes(count)' from Supabase
    comments: { count: number }[]; // Matches 'Comments(count)' from Supabase
    profiles: { username: string; avatar_url: string }[]; // Matches 'profiles(username, avatar_url)' from Supabase
}


// A custom hook to fetch all profile-related data
export const useProfileData = (username: string | undefined) => {
    const [profile, setProfile] = useState<any>(null);
    const [userPosts, setUserPosts] = useState<PostWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    });
    const [isFollowing, setIsFollowing] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (username) {
            loadProfileAndPosts();
        }
    }, [username]);

    

    // This function fetches all posts for a given user ID.
    const fetchUserPosts = async (userId: string) => {
    const { data, error } = await supabase
        .from("posts")
        .select(`
        *,
        movies (
            title,
            poster_path,
            release_date
        ),
        votes(count),
        comments(count),
        profiles(username, avatar_url)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching user posts:", error);
        return [];
    }

    return data || [];
    };

    // This function loads both the profile and its associated posts.
    const loadProfileAndPosts = async () => {
    try {
        setLoading(true); // Start loading
        const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, bio, avatar_url, created_at, updated_at")
        .eq("username", username)
        .single();

        if (profileError || !profileData) {
        console.error("Profile not found:", profileError);
        setProfile(null);
        setUserPosts([]); // Clear posts if profile not found
        } else {
        setProfile(profileData);
                // Check follow status for the current logged-in user, if available
                if (user && profileData?.id) {
                    checkFollowStatus(user.id, profileData.id).catch((err) => {
                        console.warn("Failed to check follow status:", err);
                    });
                }
        
        // Now, fetch the posts for this specific user.
        const posts = await fetchUserPosts(profileData.id);
        setUserPosts(posts as PostWithRelations[]);
        setStats(prevStats => ({
            ...prevStats,
            posts: posts.length
        }));
        }
    } catch (err) {
        console.error("Error loading profile or posts:", err);
        setProfile(null); // Clear profile state on error
        setUserPosts([]); // Clear posts on error
    } finally {
        setLoading(false); // Always turn off loading
    }
    };

    useEffect(() => {
    if (username) {
        loadProfileAndPosts();
    }
    }, [username]); // Only re-run when the username in the URL changes

        // Check if current user follows the profile target
        const checkFollowStatus = async (currentUserId: string, targetUserId: string) => {
            try {
                const { data } = await supabase
                    .from('follows')
                    .select('*')
                    .eq('follower_id', currentUserId)
                    .eq('following_id', targetUserId)
                    .maybeSingle();
                setIsFollowing(!!data);
            } catch (err) {
                console.error('checkFollowStatus error', err);
                setIsFollowing(false);
            }
        };

        const toggleFollow = async (currentUserId: string | undefined, targetUserId: string) => {
            if (!currentUserId) return;
            try {
                if (isFollowing) {
                    await supabase.from('follows').delete()
                        .eq('follower_id', currentUserId).eq('following_id', targetUserId);
                } else {
                    await supabase.from('follows').insert({
                        follower_id: currentUserId,
                        following_id: targetUserId
                    });
                }
                setIsFollowing(prev => !prev);
                // Refresh posts/stats after toggling
                await loadProfileAndPosts();
            } catch (err) {
                console.error('toggleFollow error', err);
            }
        };

    // The hook returns all the data and state needed by the component.
    return { profile, userPosts, stats, loading, loadProfileAndPosts, isFollowing, toggleFollow };
};


  // NO LONGEr NEEDED AS fetchUserPosts does this
  // const fetchUserStats = async () => {
  //   // Get post count
  //   const { count: postCount } = await supabase
  //     .from("posts")
  //     .select("*", { count: "exact", head: true })
  //     .eq("user_id", user?.id);

  //   // Placeholder for followers/following - adapt to your schema
  //   setStats({
  //     posts: postCount || 0,
  //     followers: 2_000_000, // Replace with actual count when implemented DEBUG - remove/edit
  //     following: 2  // Replace with actual count when implemented DEBUG - remove edit
  //   });
  // };