/** [EditCommunityModal.tsx] */
import { useState } from "react";
import { supabase } from "../supabase-client";
import { Close, Save, DeleteForever, Image } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { ConfirmModal } from "./ConfirmModal";
import { ImageUploader } from "./ImageUploader";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  community: { id: number; title: string; description: string; image_url?: string | null };
  onSave: () => void;
}

export const EditCommunityModal = ({ isOpen, onClose, community, onSave }: Props) => {
  const [title, setTitle] = useState(community.title);
  const [description, setDescription] = useState(community.description);
  const [imageUrl, setImageUrl] = useState(community.image_url || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("communities")
        .update({ title, description, image_url: imageUrl })
        .eq("id", community.id);

      if (error) throw error;
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("communities").delete().eq("id", community.id);
      if (error) throw error;
      navigate("/communities"); // Redirect to communities list
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-gray-900 border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h2 className="text-white font-bold">Edit Community Settings</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><Close /></button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Community Name</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" />
            </div>

            {/* Image Uploader for NEW Banner */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Upload New Banner</label>
              <ImageUploader 
                bucketName="banners" // Tells the uploader to save to your new folder
                onImageChange={(_, url) => setImageUrl(url || "")} 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none resize-none" />
            </div>
          </div>

          <div className="p-4 bg-black/20 border-t border-white/5 flex justify-between items-center">
            <button onClick={() => setShowConfirm(true)} className="text-red-500 hover:text-red-400 flex items-center gap-1 font-bold text-sm">
              <DeleteForever fontSize="small" /> Delete Community
            </button>
            <div className="flex gap-3">
              <button onClick={onClose} className="text-gray-400 hover:text-white">Cancel</button>
              <button onClick={handleUpdate} disabled={isSaving} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-full font-bold transition flex items-center gap-2">
                <Save fontSize="small" /> {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showConfirm} 
        onClose={() => setShowConfirm(false)} 
        onConfirm={handleDelete} 
        title="Delete Community?" 
        message="Warning: This will permanently delete this community and all associated data. This cannot be undone."
      />
    </>
  );
};