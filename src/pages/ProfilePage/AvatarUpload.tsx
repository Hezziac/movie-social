/** [AvatarUpload.tsx]
 * 
 * * A custom addon component created to enhance user profiles by allowing 
 * users to upload and update their personal avatars.
 * Handles the interaction with Supabase Storage buckets and provides real-time 
 * preview updates.
 * * * * Note on AI Usage: 
 * - **TypeScript & Refactoring**: GitHub Copilot and Perplexity AI were used to 
 * ensure strict type safety for the 'AvatarUploadProps' and to refactor the 
 * asynchronous upload logic for better error handling.
 * - **Supabase Storage Integration**: AI assisted in implementing the 'upsert' 
 * logic and the unique file path generation (`${uid}/${Date.now()}`) to prevent 
 * naming collisions in the storage bucket.
 * - **Debugging**: AI was used to resolve issues with the 'publicUrl' retrieval 
 * and to ensure the 'onUpload' callback correctly synchronized state with the 
 * parent Profile component.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase-client';
import { AccountCircle } from '@mui/icons-material'; // For the default avatar icon

interface AvatarUploadProps {
  uid: string; // The user's unique ID
  url: string | null; // The current avatar URL
  onUpload: (event: React.ChangeEvent<HTMLInputElement>, filePath: string) => void; // Callback to parent when upload is complete
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ uid, url, onUpload }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Update local state if the parent's URL prop changes
    setAvatarUrl(url);
  }, [url]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      // Security/Collision Logic: Implemented with AI assistance to ensure every 
      // upload has a unique path using the user's ID and a timestamp, 
      // preventing users from accidentally overwriting other people's data.
      const file = event.target.files[0];

      // 1. GENERATE A SAFE FILENAME
      // This removes spaces and anything not a letter, number, or dot
      const safeName = file.name
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9._]/g, ''); // Remove special characters

      // 2. CREATE THE FINAL PATH
      // Including a timestamp is still smart to prevent caching issues
      const filePath = `${uid}/${Date.now()}-${safeName}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars') // Your Supabase storage bucket name
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Overwrite if file with same name exists
        });

      if (uploadError) {
        console.error("Supabase Storage Upload Error:", uploadError); // Add this
        // THIS WILL PRINT THE EXACT CLOUD ERROR MESSAGE
        console.error("FULL ERROR OBJECT:", JSON.stringify(uploadError, null, 2));
        throw uploadError;
      }

      // Get the public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setAvatarUrl(publicUrlData.publicUrl);
        // State Synchronization: AI helped refactor this callback to ensure the 
        // parent 'Profile' component receives the new public URL immediately 
        // after a successful database update.
        // Call the onUpload callback to inform the parent component
        onUpload(event, publicUrlData.publicUrl);
      } else {
        
        throw new Error('Failed to get public URL for avatar.');
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error.message);
      alert(error.message); // Use a custom modal in production
      
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Current Avatar Display */}
      <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center border-2 border-purple-600 overflow-hidden">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <AccountCircle className="text-gray-400 text-6xl" /> // Default icon
        )}
      </div>

      {/* File Input for Upload */}
      <label htmlFor="avatar-upload" className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
        {uploading ? 'Uploading...' : 'Change Avatar'}
        <input
          type="file"
          id="avatar-upload"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="hidden" // Hide the default file input
        />
      </label>
    </div>
  );
};
