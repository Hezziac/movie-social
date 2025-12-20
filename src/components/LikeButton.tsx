 /* [LikeButton.tsx]
 * 
 * Contains the LikeButton component for a post, allowing users to like or dislike posts.
 * * * SOURCE ATTRIBUTION:
 * This file was originally provided by the following tutorial:
 * [PedroTech Social Media Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)
 * I have adapted the code specifically to match my project's Supabase data structure 
 * and TypeScript requirements.
 * * * Note on AI Usage: 
 * - **Code Explanation & Learning**: GitHub Copilot and Perplexity AI were used after the 
 * tutorial to provide detailed comments and assist in my fundamental understanding 
 * of how the mutation and vote-checking logic work in TypeScript.
 * - **Refactoring**: AI assisted in ensuring the types for the 'Vote' interface 
 * and 'mutate' function correctly matched my Supabase schema.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";

interface Props {
  postId: number;
}

//creating to track total votes
interface Vote {
  id: number;
  post_id: number;
  user_id: string;
  vote: number;
}

const vote = async (voteValue: number, postId: number, userId: string) => {
  // SETUP CHECKING IF LIKE IS IN DB FIRST
  // step 1
  const { data: existingVote } = await supabase
    .from("votes") //access votes table
    .select("*") //select all items -
    .eq("post_id", postId) // WHERE User id = user id
    .eq("user_id", userId)
    .maybeSingle();

  if (existingVote) {
    // Liked -> 0, Like -> -1
    if (existingVote.vote === voteValue) {
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("id", existingVote.id);

      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("votes")
        .update({ vote: voteValue })
        .eq("id", existingVote.id);

      if (error) throw new Error(error.message);
    }
  } else {
    // if neither above we are liking when it was either a like/Dislike
    const { error } = await supabase
      .from("votes")
      .insert({ post_id: postId, user_id: userId, vote: voteValue });

    if (error) throw new Error(error.message);
  }
};

//create fetch votes Fn to use in LikeButton
// calculates total votes
const fetchVotes = async (postId: number): Promise<Vote[]> => {
  const { data, error } = await supabase
    .from("votes") //access votes table
    .select("*") //select all items -
    .eq("post_id", postId); // WHERE User id = user id

  if (error) throw new Error(error.message);
  return data as Vote[];
};

export const LikeButton = ({ postId }: Props) => {
  const { user } = useAuth();

  const queryClient = useQueryClient();

  const {
    data: votes,
    isLoading,
    error,
  } = useQuery<Vote[], Error>({
    queryKey: ["votes", postId],
    queryFn: () => fetchVotes(postId),
    refetchInterval: 600000, // could effect cost (every 5(currently 60 sec) sec it fetches likes( wothout refesh?))
  });

  const { mutate } = useMutation({
    mutationFn: (voteValue: number) => {
      if (!user) throw new Error("You must be logged in to vote!");
      return vote(voteValue, postId, user!.id);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["votes", postId] });
    },
  });

  if (isLoading) {
    return <div>Loading votes...</div>;
  }

  if (error) {
    return <div> Error: {error.message}</div>;
  }

  //filter though and default 0 for likes
  const likes = votes?.filter((v) => v.vote === 1).length || 0;
  const dislikes = votes?.filter((v) => v.vote === -1).length || 0;

  //const to seatch for userId and return their value for CSS
  const userVote = votes?.find((v) => v.user_id === user?.id)?.vote;
  return (
    <div className="flex items-center space-x-4 my-4">
      <button
        onClick={() => mutate(1)}
        className={`px-3 py-1 cursor-pointer rounded transition-colors duration-150 ${
          userVote === 1 ? "bg-green-500 text-white" : "bg-gray-200 text-black"
        }`}
      >
        👍 {likes}
      </button>
      <button
        onClick={() => mutate(-1)}
        className={`px-3 py-1 cursor-pointer rounded transition-colors duration-150 ${
          userVote === -1 ? "bg-red-500 text-white" : "bg-gray-200 text-black"
        }`}
      >
        👎 {dislikes}
      </button>
    </div>
  );
};
