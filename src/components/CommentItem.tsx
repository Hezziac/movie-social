/**
 * [CommentItem.tsx]
 * 
 * Component for displaying individual comments and their replies.
 * Supports replying to comments, deleting comments (soft delete), and collapsing/expanding replies.
 * Originally developed following [Tutorial: https://www.youtube.com/watch?v=_sSTzz13tVY. By PedroTech] and customized for this project.
 * * Note on AI Usage: 
 * This file contains TypeScript syntax and logic refactored with the assistance 
 * of GitHub Copilot and Perplexity AI to ensure type safety and resolve bugs.
 * Specific logic for [Soft Delete] was implemented following
 * architectural patterns suggested by [Github Co-Pilot].
 */

import { useState } from "react";
import { Comment } from "./CommentSection";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Props {
  comment: Comment & {
    children?: Comment[];
  };
  postId: number;
}

const createReply = async (
  replyContent: string,
  postId: number,
  parentCommentId: number,
  userId?: string,
  author?: string
) => {
  if (!userId || !author) {
    throw new Error("You must be logged in to reply.");
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    content: replyContent,
    parent_comment_id: parentCommentId,
    user_id: userId,
    author: author,
  });

  if (error) throw new Error(error.message);
};

export const CommentItem = ({ comment, postId }: Props) => {
  const [showReply, setShowReply] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Structure suggestion by GitHub Co-Pilot for fetching replier's username
  // 1. ADD THIS: Fetch the official username for the person REPLYING
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
    enabled: !!user?.id,
  });

  // 2. NEW EDIT MUTATION (Renamed to 'mutateEdit' to avoid red lines)
  const { mutate: mutateEdit, isPending: isEditingPending } = useMutation({
    mutationFn: async (newContent: string) => {
      const { error } = await supabase
        .from("comments")
        .update({ content: newContent })
        .eq("id", comment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      setIsEditing(false);
    },
  });

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (replyContent: string) =>
      createReply(
        replyContent,
        postId,
        comment.id,
        user?.id,
        profile?.username
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      setReplyText("");
      setShowReply(false);
    },
  });

  // Fetch the post owner so the post owner can also delete comments
  const { data: postOwnerData } = useQuery({
    queryKey: ["postOwner", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", postId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });

  const postOwnerId: string | undefined = postOwnerData?.user_id;

  // Soft-delete logic suggested by GitHub Co-Pilot
  // Soft-delete: replace content & author but keep the comment row
  const deleteComment = async (commentId: number) => {
    const { error } = await supabase
      .from("comments")
      .update({ content: "[Deleted Comment]", author: "[deleted]" })
      .eq("id", commentId);
    if (error) throw new Error(error.message);
  };

  const { mutate: mutateDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteComment(comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: (err) => console.error("deleteComment error", err),
  });

  const isAuthor = user?.id === comment.user_id;
  const isPostOwner = user?.id === postOwnerId;

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText) return;
    mutate(replyText);
  };

  return (
    <div className="pl-4 border-l border-white/10 mt-4">
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-bold ${comment.author === "[deleted]" ? "text-gray-500" : "text-blue-400"}`}>
              {comment.author}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(comment.created_at).toLocaleString()}
              {/* EDITED BADGE */}
              {comment.updated_at && (new Date(comment.updated_at).getTime() - new Date(comment.created_at).getTime() > 2000) && (
                <span className="ml-1 opacity-60 italic text-[10px] text-purple-500">• edited</span>
              )}
            </span>
            <div className="flex gap-3">
              {/* NEW EDIT BUTTON - Only show if it's the author and not deleted */}
              {isAuthor && comment.author !== "[deleted]" && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-gray-500 hover:text-purple-400"
                >
                  Edit
                </button>
              )}

              {(isAuthor || isPostOwner) && comment.author !== "[deleted]" && (
                <button
                  onClick={() => {
                    if (confirm("Delete this comment? CANNOT BE RESTORED!\nThis will replace it with a '[Deleted Comment]' placeholder.")) {
                      mutateDelete();
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-400"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
          </div>

          {/* (Delete handled above) */}
        </div>

        {/* 5. DYNAMIC CONTENT AREA (Text vs Editor) */}
        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full border border-white/10 bg-black/40 p-2 rounded text-gray-200 text-sm focus:border-purple-500 outline-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button 
                onClick={() => mutateEdit(editText)}
                disabled={isEditingPending}
                className="text-xs bg-purple-600 px-3 py-1 rounded text-white disabled:opacity-50"
              >
                {isEditingPending ? "Saving..." : "Save"}
              </button>
              <button 
                onClick={() => { setIsEditing(false); setEditText(comment.content); }}
                className="text-xs text-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className={`${comment.author === "[deleted]" ? "text-gray-500 italic" : "text-gray-300"}`}>
            {comment.content}
          </p>
        )}

        {comment.author !== "[deleted]" && (
          <button
            onClick={() => setShowReply((prev) => !prev)}
            className="text-blue-500 text-sm mt-1"
          >
            {showReply ? "Cancel" : "Reply"}
          </button>
        )}
      </div>
      {showReply && user && (
        <form onSubmit={handleReplySubmit} className="mb-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full border border-white/10 bg-transparent p-2 rounded"
            placeholder="Write a reply..."
            rows={2}
          />
          <button
            type="submit"
            className="mt-1 bg-blue-500 text-white px-3 py-1 rounded"
          >
            {isPending ? "Posting..." : "Post Reply"}
          </button>
          {isError && <p className="text-red-500">Error posting reply.</p>}
        </form>
      )}

      {comment.children && comment.children.length > 0 && (
        <div>
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            title={isCollapsed ? "Hide Replies" : "Show Replies"}
          >
            {isCollapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            )}
          </button>

          {!isCollapsed && (
            <div className="space-y-2">
              {comment.children.map((child, key) => (
                <CommentItem key={key} comment={child} postId={postId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};