/**
 * [CommentSection.tsx]
 * 
 * * Contains the main comment section component. Handles displaying comments,
 * nested replies, and real-time updates via React Query.
 * * * SOURCE ATTRIBUTION:
 * This entire file was originally provided by the following tutorial:
 * [PedroTech Social Media Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)
 * I have adapted the code specifically to match my project's Supabase data structure
 * and TypeScript requirements.
 * * * Note on AI Usage: 
 * GitHub Copilot and Perplexity AI were used only to assist in refactoring the 
 * inherited logic to match my specific database schema and to resolve 
 * TypeScript syntax errors encountered during the adaptation.
 */

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { CommentItem } from "./CommentItem";

interface Props {
  postId: number;
}

interface NewComment {
  content: string;
  parent_comment_id?: number | null;
}

export interface Comment {
  id: number;
  post_id: number;
  parent_comment_id: number | null;
  content: string;
  user_id: string;
  created_at: string;
  author: string;
}

const createComment = async (
  newComment: NewComment,
  postId: number,
  userId?: string,
  author?: string
) => {
  if (!userId || !author) {
    throw new Error("You must be logged in to comment");
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    content: newComment.content,
    parent_comment_id: newComment.parent_comment_id || null,
    user_id: userId,
    author: author,
  });

  if (error) throw new Error(error.message + "--SupabaseError--");
};

const fetchComments = async (postId: number): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from("comments") //access the {tableName} table
    .select("*") //select all items -
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data as Comment[];
};

export const CommentSection = ({ postId }: Props) => {
  const [newCommentText, setNewCommentText] = useState<string>("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetch the official username from your profiles table
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id, // Only run if a user is logged in
  });

  const {
    data: comments,
    isLoading,
    error,
  } = useQuery<Comment[], Error>({
    queryKey: ["comments", postId],
    queryFn: () => fetchComments(postId),
    refetchInterval: 5000, // could effect cost (every 5 sec it fetches likes( wothout refesh?))
  });

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (newComment: NewComment) =>
      createComment(
        newComment,
        postId,
        user?.id,
        profile?.username
      ),

      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["comments", postId]})
      }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCommentText) return;

    mutate({ content: newCommentText, parent_comment_id: null });
    setNewCommentText("");
  };


  /* Each comment will have the Id as the key and the list (of comments) as its child
  Roots: holds top comment with no replies
  Map of comments - organize Replies - return tree - PedroTech*/
  const buildCommentTree = (
    flatComments: Comment[]
  ): (Comment & { children?: Comment[] })[] => {
    // Map to hold comment references
    const map = new Map<number, Comment & { children?: Comment[] }>();
    const roots: (Comment & { children?: Comment[] })[] = [];

    flatComments.forEach((comment) => {
      map.set(comment.id, { ...comment, children: [] });
    });

    flatComments.forEach((comment) => {
      if (comment.parent_comment_id) {
        const parent = map.get(comment.parent_comment_id);
        if (parent) {
          parent.children!.push(map.get(comment.id)!);
        }
      } else {
        roots.push(map.get(comment.id)!);
      }
    });
    return roots;
  };

  if (isLoading) {
    return <div>Loading comments...</div>;
  }

  if (error) {
    return <div> Error: {error.message}</div>;
  }

  const commentTree = comments ? buildCommentTree(comments) : [];

  return (
    <div className="mt-6">
      <h3 className="text-2xl font-semibold mb-4">Comments</h3>

      {/* Create comment section  */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-4">
          {" "}
          <textarea
            className="w-full border border-white/10 bg-transparent p-2 rounded"
            value={newCommentText}
            rows={3}
            placeholder="Write a comment..."
            onChange={(e) => setNewCommentText(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newCommentText}
            className="mt-2 bg-purple-500 text-white px-4 py-2 rounded cursor-pointer"
          >
            {isPending ? "Posting..." : "Post Comment"}
          </button>
          {isError && (
            <p className="text-red-500 mt-2">Error Posting comment.</p>
          )}
        </form>
      ) : (
        <p className="mb-4 text-gray-600">
          You must be logged in to post a comment
        </p>
      )}


      {/* Comments Display Section */}
        <div className="space-y-4">
          {commentTree.map((comment, key) => (
          <CommentItem key={key} comment={comment} postId={postId} />
        ))}

        </div>
      </div>
  );
};
