/** [useProfileData.ts]
 * 
 * * A custom React hook designed to centralize all data-fetching logic for the 
 * Profile Page. It manages state for user profiles, posts, stats, and 
 * follower relationships.
 * * * * Note on AI Usage: 
 * - **Architectural Refactoring**: GitHub Copilot and Perplexity AI assisted in 
 * extracting this logic from the 'ProfilePage' component into a standalone hook 
 * to improve code reusability and maintainability.
 * - **Relational Queries**: AI helped structure the complex Supabase '.select()' 
 * strings to perform nested joins across the 'posts', 'movies', 'votes', 
 * and 'comments' tables in a single network request.
 * - **Social Logic**: AI assisted in implementing the 'toggleFollow' and 
 * 'checkFollowStatus' logic, ensuring the UI correctly reflects the 
 * relationship between the logged-in user and the target profile.
 */
import { useEffect, useState } from "react";
import { supabase } from "../../supabase-client";
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

    

    // Relational Fetching: AI helped refactor this query to use nested 
    // selections. This allows the app to fetch a post's metadata, movie info, 
    // and vote/comment counts in one go, rather than making separate calls.
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
        .select("id, username, bio, avatar_url, created_at, updated_at, followers_count, following_count")
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
        setStats({
            posts: posts.length,
            followers: profileData.followers_count || 0,
            following: profileData.following_count || 0
        });
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

        // Social Relationship Logic: Implemented with AI assistance to handle 
        // the asynchronous 'insert' and 'delete' operations on the 'follows' 
        // table, while triggering a re-fetch of stats to keep the UI in sync.
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
