/** [EditPostModal.tsx]
 * * A specialized modal for updating existing post content.
 * * * Note on AI Usage: 
 * - **State Sync**: AI helped implement the initial state synchronization so 
 * the modal always opens with the most current post data.
 * - **Database Logic**: Refactored with AI to handle the Supabase '.update()' 
 * operation, provide immediate feedback via the onSave callback and Updated to 
 * handle Tag Highlighting and Relational Tag Synchronization.
 */
import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabase-client";
import { Close, Save, DeleteForever, NoPhotography } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { ConfirmModal } from "./ConfirmModal";
import { ImageUploader } from "./ImageUploader";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  initialTitle: string;
  initialContent: string;
  initialPhoto: string | null;
  onSave: () => void;
}

export const EditPostModal = ({ isOpen, onClose, postId, initialTitle, initialContent, initialPhoto, onSave }: Props) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPhoto);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setContent(initialContent);
      setPreviewUrl(initialPhoto);
      setNewPhotoFile(null);
      setIsUploading(false);
    }
  }, [initialTitle, initialContent, initialPhoto, isOpen]);
  
  if (!isOpen) return null;

  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Tag highlighting logic (same as CreatePost)
  const highlightTags = (text: string) => {
    return text.split(/(#[a-zA-Z0-9_]+)/g).map((part, i) =>
      part.startsWith("#") ? (
        <span key={i} className="text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    if (isUploading) return; 
    try {
      let finalImageUrl = previewUrl;

      // 2. If a NEW file was selected, upload it first
      if (newPhotoFile) {
        setIsUploading(true);
        const fileExt = newPhotoFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `post-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("posts") 
          .upload(filePath, newPhotoFile);

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: urlData } = supabase.storage.from("posts").getPublicUrl(filePath);
        finalImageUrl = urlData.publicUrl;
        setIsUploading(false);
      }

      const { error: postUpdateError } = await supabase
        .from("posts")
        .update({ 
          title, 
          content, 
          image_url: finalImageUrl })
        .eq("id", postId);

      if (postUpdateError) throw postUpdateError;

      // 2. Extract tags from the new content
      const tagNames =
        content
          .match(/#[a-zA-Z0-9_]+/g)
          ?.map((tag) => tag.slice(1).toLowerCase())
          /* SAFETY CHECK: Filter out tags that are empty OR longer than 50 chars */
          .filter((tag) => tag && tag.length > 0 && tag.length <= 50) || [];

      // 3. Sync Tags (Delete old relations and build new ones)
      // First, remove all existing relations for this post
      const { error: deleteRelError } = await supabase
        .from("post_tags")
        .delete()
        .eq("post_id", postId);
      
      if (deleteRelError) throw deleteRelError;

      if (tagNames.length > 0) {
        // Upsert tags into the main 'tags' table
        const { error: tagUpsertError } = await supabase.from("tags").upsert(
          tagNames.map((name) => ({
            name,
            slug: name, // simplify slug for MVP
          })),
          { onConflict: "name" }
        );
        if (tagUpsertError) throw tagUpsertError;

        // Fetch IDs for these tags
        const { data: tagData, error: fetchTagsError } = await supabase
          .from("tags")
          .select("id")
          .in("name", tagNames);
        if (fetchTagsError) throw fetchTagsError;

        // Re-insert new relations
        if (tagData && tagData.length > 0) {
          const { error: insertRelError } = await supabase
            .from("post_tags")
            .insert(
              tagData.map((tag) => ({
                post_id: postId,
                tag_id: tag.id,
              }))
            );
          if (insertRelError) throw insertRelError;
        }
      }
      
      onSave();
      onClose();
    } catch (err) {
      console.error("Update failed:", err);
      alert("Error updating post.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
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

  // Helper to remove photo
  const handleRemovePhoto = () => {
    setNewPhotoFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 w-full max-w-lg rounded-2xl overflow-y-auto max-h-[90vh] shadow-2xl relative">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-white font-bold">Edit Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <Close />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Image Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-500 uppercase ml-1">Post Photo</label>
              {previewUrl && (
                <button 
                  onClick={handleRemovePhoto}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                >
                  <NoPhotography sx={{ fontSize: 14 }} /> Remove Photo
                </button>
              )}
            </div>

            {/* Preview of current/new image */}
            {previewUrl && (
              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/10 bg-black">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              </div>
            )}

            <ImageUploader 
              onImageChange={(file, url) => {
                setNewPhotoFile(file);
                setPreviewUrl(url);
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Content</label>
            <div className="relative h-48 md:h-64 w-full">
              {/* 1. The Highlighting Overlay (Behind the text) */}
              <div 
                ref={highlightRef}
                className="absolute inset-0 p-3 font-sans text-sm md:text-base whitespace-pre-wrap pointer-events-none overflow-hidden text-gray-300 z-10 border border-transparent"
              >
                {highlightTags(content)}
              </div>
              {/* Tag Highlighting Overlay */}
              <textarea
                ref={textareaRef}
                rows={8}
                value={content}
                onScroll={handleScroll} // SYNC SCROLL HERE
                onChange={(e) => setContent(e.target.value)}
                className="absolute inset-0 w-full h-full bg-transparent border border-gray-700 p-3 rounded-lg text-transparent caret-white focus:ring-2 focus:ring-purple-500 outline-none transition overflow-y-auto z-20 font-sans text-sm md:text-base leading-normal resize-none"
                placeholder="Share your thoughts..."
              />
            </div>
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
            disabled={isSaving|| isUploading}
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