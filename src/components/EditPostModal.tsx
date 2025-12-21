/** [EditPostModal.tsx]
 * * A specialized modal for updating existing post content.
 * * * Note on AI Usage: 
 * - **State Sync**: AI helped implement the initial state synchronization so 
 * the modal always opens with the most current post data.
 * - **Database Logic**: Refactored with AI to handle the Supabase '.update()' 
 * operation and provide immediate feedback via the onSave callback.
 */
import { useState } from "react";
import { supabase } from "../supabase-client";
import { Close, Save, DeleteForever } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { ConfirmModal } from "./ConfirmModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  initialTitle: string;
  initialContent: string;
  onSave: () => void;
}

export const EditPostModal = ({ isOpen, onClose, postId, initialTitle, initialContent, onSave }: Props) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("posts")
        .update({ title, content })
        .eq("id", postId);

      if (error) throw error;
      onSave();
      onClose();
    } catch (err) {
      console.error("Update failed:", err);
      alert("Error updating post.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      onClose();
      navigate("/"); // Send user back to feed after successful deletion
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Could not delete post.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-white font-bold">Edit Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <Close />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition resize-none"
            />
          </div>
        </div>

        {/* Footer with Delete and Save */}
        <div className="p-4 bg-black/20 border-t border-white/5 flex justify-between items-center">
          <button
            onClick={() => setShowConfirm(true)} // Open Warning Modal
            className="text-red-500 hover:text-red-400 flex items-center gap-1 font-bold"
          >
            <DeleteForever fontSize="small" /> Delete
          </button>
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white font-medium">
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-full font-bold transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save fontSize="small" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    <ConfirmModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete} // This calls the database function directly
        title="Delete Post?"
        message="This action cannot be undone. All likes and comments on this movie post will be permanently removed."
      />
    </div>
  );
};