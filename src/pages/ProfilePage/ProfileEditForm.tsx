/** [ProfileEditForm.tsx]
 * 
 * * A custom form component created to allow users to update their profile information,
 * including username, bio, and avatar. 
 * Handles real-time validation and ensures changes are correctly reflected in the 
 * Supabase 'profiles' table.
 * * * * Note on AI Usage: 
 * - **Validation Logic**: GitHub Copilot and Perplexity AI assisted in implementing 
 * the regex for username validation and the logic to check for username uniqueness 
 * before allowing a database update.
 * - **State Management**: AI helped refactor the 'formData' state to handle multiple 
 * inputs simultaneously and synchronized the 'AvatarUpload' callback with the 
 * final save operation.
 * - **Error Handling**: AI assisted in creating the try/catch flow to provide 
 * user-friendly error messages for database conflicts or network issues.
 */

import React, { useState } from 'react';
import { supabase } from '../../supabase-client';
import { User } from "@supabase/supabase-js";
import { AvatarUpload } from './AvatarUpload'; 

interface ProfileEditFormProps {
  profile: {
    username: string;
    bio: string | null;
    id: string;
    avatar_url: string | null; // Add avatar_url to profile prop
  };
  user: User | null;
  onSave: (updatedUsername: string) => void;
  onCancel: () => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ profile, user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: profile.username,
    bio: profile.bio || "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url); // New state for avatar URL
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async () => {
    setError(null);
    setIsSaving(true);

    if (!user) {
      setError("No user session found. Please log in.");
      setIsSaving(false);
      return;
    }

    // Security & Validation: Implemented with AI assistance to ensure usernames 
    // follow specific patterns (3-20 chars, alphanumeric) to prevent database errors 
    // or injection attempts.
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      setError("Username must be 3-20 characters (letters, numbers, underscores).");
      setIsSaving(false);
      return;
    }

    // Database Sync: Refactored with AI to include the new 'avatar_url' in 
    // the profile update, ensuring the user's new image persists across sessions.
    try {
      if (formData.username !== profile.username) {
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("username", formData.username)
          .single();

        if (count && count > 0) {
          setError("Username is already taken.");
          setIsSaving(false);
          return;
        }
      }

      // Update the profile in the database, including the new avatarUrl
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: formData.username,
          bio: formData.bio,
          avatar_url: avatarUrl, // Include avatarUrl in the update
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      onSave(formData.username);
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 mb-8 space-y-4">
      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      {/* Avatar Upload Component */}
      {user && ( // Only show avatar upload if user is logged in
        <AvatarUpload
          uid={user.id}
          url={profile.avatar_url} // Pass current avatar URL
          onUpload={(_event, newUrl) => {
            setAvatarUrl(newUrl); // Update local state with new avatar URL
            // Optionally, you might want to auto-save here or indicate unsaved changes
          }}
        />
      )}

      <div>
        <label className="block text-gray-300 mb-2">Username</label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData(p => ({ ...p, username: e.target.value }))}
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-gray-300 mb-2">Bio</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 h-32 focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
      </div>
      <div className="flex gap-4">
        <button
          onClick={handleUpdate}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex-1"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex-1"
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
