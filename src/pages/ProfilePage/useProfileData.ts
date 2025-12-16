// useProfileData.ts for fetching data on profile page 
import { useEffect, useState } from "react";
import { supabase } from "../../supabase-client"; // Adjust path if your supabase-client is elsewhere
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
        id,
        title,
        image_url,
        content,
        created_at,
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
        
        // Now, fetch the posts for this specific user.
        const posts = await fetchUserPosts(profileData.id);
        setUserPosts(posts);
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

    // The hook returns all the data and state needed by the component.
    return { profile, userPosts, stats, loading, loadProfileAndPosts };
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