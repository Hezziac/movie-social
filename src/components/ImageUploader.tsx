/** [ImageUploader.tsx]
 * 
 * * A reusable component for handling image selection, instant Supabase storage uploads,
 * and local preview rendering. 
 * * * * SOURCE ATTRIBUTION:
 * This logic was originally part of my 'CreatePost.tsx' (derived from PedroTech's tutorial).
 * I extracted it into a standalone component to improve code readability and maintainability.
 * * * * Note on AI Usage: 
 * - **Refactoring**: GitHub Copilot and Perplexity AI assisted in the modularization 
 * of this code from the parent component.
 * - **Memory Management (Blob URLs)**: AI specifically helped implement the 'useEffect' 
 * logic for creating and revoking Object URLs (URL.createObjectURL). This was crucial 
 * for fixing "blob leakage" and ensuring images render correctly without memory leaks.
 * - **Async Upload Flow**: AI assisted in structuring the try/catch block for 
 * immediate background uploading to Supabase.
 */ 

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client'; // Adjust path as needed
import { AspectRatio } from '../context/AspectRatios'; // Import AspectRatio type

interface ImageUploaderProps {
  // Callback to inform parent about image selection/upload and aspect ratio
  onImageChange: (file: File | null, url: string | null, aspectRatio: AspectRatio) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  bucketName?: string; // Optional: specify a different bucket if needed
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange, onUploadStateChange, bucketName = "post-images" }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null); 
  // const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>("original");
  const selectedAspectRatio: AspectRatio = "original"; //TEMP MVP
  const [uploading, setUploading] = useState(false);

  // NEW: State to hold the temporary Blob URL for image preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // NEW: Effect implemented with AI assistance to handle temporary Blob URLs.
  // This ensures that local previews are shown instantly, and the memory is 
  // cleaned up (revoked) as soon as the file changes or the component unmounts.
  useEffect(() => {
    // If no file is selected, or if the component is unmounting, clean up
    if (!selectedFile) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      return;
    }

    // 1. Create the new Blob URL
    const objectUrl = URL.createObjectURL(selectedFile);
    
    // 2. Set it in state for the image preview
    setPreviewUrl(objectUrl);

    // 3. Define the cleanup function: this runs when the component unmounts 
    // or when the dependencies ([selectedFile]) change for the next run.
    return () => URL.revokeObjectURL(objectUrl);

  }, [selectedFile]); // Dependency: Re-run effect only when selectedFile changes (a new file is selected or cleared)

  // Function to handle file selection and immediate preview
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setPublicUrl(null); // Reset URL before new upload
    
    // If a file is selected, immediately upload it and get its URL
    if (file) {
      setUploading(true);
      if (onUploadStateChange) onUploadStateChange(true);
      try {
        const fileExt = file.name.split('.').pop();
        // Generate a unique file path (you might need user ID here if not public bucket)
        const filePath = `${bucketName}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9-_.]/g, "")}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(bucketName) // Your bucket name
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          setPublicUrl(urlData.publicUrl); // Save the public URL
          // Use the public URL in the callback
          onImageChange(file, urlData.publicUrl, selectedAspectRatio); // MARD CODED FOR MVP -selectedAspectRatio- Pass file, public URL, and aspect ratio to parent
        } else {
          throw new Error("Failed to get public URL for image.");
        }
      } catch (error: any) {
        console.error("Image upload failed:", error.message);
        alert("Image upload failed: " + error.message); // Use a custom modal in production
        setSelectedFile(null); // Clear selected file on error
        setPublicUrl(null); // Reset URL on error
        onImageChange(null, null, "original"); // Reset parent state on error
      } finally {
        setUploading(false);
        if (onUploadStateChange) onUploadStateChange(false);
      }
    } else {
      setPublicUrl(null); // Reset URL
      // If no file is selected (e.g., user cleared input), reset parent state
      onImageChange(null, null, "original");
    }
  };

  // Function to remove the selected image
  const handleRemoveImage = () => {
    setSelectedFile(null); // This triggers the useEffect to revoke the URL
    setPublicUrl(null); // Clear public URL
    // setSelectedAspectRatio("original");
    onImageChange(null, null, "original"); // Notify parent to clear image
    if (onUploadStateChange) onUploadStateChange(false);
  };

  // Effect to notify parent if aspect ratio changes after file selection
  useEffect(() => {
    // CHEKCS: Only call onImageChange if we have a file AND a publicUrl
    if (selectedFile && publicUrl) {
      // Pass the publicUrl, not a temporary Blob URL
      onImageChange(selectedFile, publicUrl, "original"); // HARD CODED FOR MVP -selectedAspectRatio-
    }
  }, [selectedFile, publicUrl]); // MVP - REMOVED ASPECT RATIO

  return (
    <>
      {/* Image Upload Input */}
      <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
        <label htmlFor="image" className="block mb-2 font-medium text-gray-200">
          Upload Image (Optional)
        </label>
        <div className="flex items-center gap-4">
          <label className="flex-1 cursor-pointer">
            <div className="border-2 border-dashed border-gray-700 hover:border-purple-500 rounded-lg p-4 text-center transition-all">
              {selectedFile ? (
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate">{selectedFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Click to upload an image</span>
                  <span className="text-xs">(Recommended for better engagement)</span>
                </div>
              )}
              <input
                type="file"
                id="image"
                accept="image/jpeg, image/png, image/webp, image/gif, image/svg+xml"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </div>
          </label>
          {selectedFile && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Remove image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Conditionally show Aspect Ratio and Preview only if a file is selected */}
      {selectedFile && (
        <>
          {/* Aspect Ratio Selection */}
          {/* <div className="mb-4">
            <label className="block mb-2 font-medium">Image Style</label>
            <div className="flex gap-2">
              {(["original", "1:1", "9:16", "16:9"] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setSelectedAspectRatio(ratio)}
                  className={`px-3 py-1 rounded-md ${
                    selectedAspectRatio === ratio
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {ratio === "original" ? "As Is" : ratio}
                </button>
              ))}
            </div>
          </div> */}

          {/* Preview with selected aspect ratio */}
          <div className="mb-4">
            <label className="block mb-2 font-medium">Preview</label>
            <div className="relative max-w-full max-h-[70vh] rounded-lg overflow-hidden">
            </div>
            {/* <div className={`relative ${
              selectedAspectRatio === "1:1" ? "aspect-square" :
              selectedAspectRatio === "9:16" ? "aspect-[9/16]" :
              selectedAspectRatio === "16:9" ? "aspect-[16/9]" :
              "max-w-full max-h-[70vh]"
            } border border-gray-600 rounded-lg overflow-hidden`}> */}

              {/* Use publicUrl OR (previewUrl AND NOT uploading).
                    This prevents rendering the temporary blob URL while the async upload is active, 
                    as the blob URL is likely being revoked at the same time.
              */}
              {(publicUrl || (previewUrl && !uploading)) ? (
                <img
                  src={publicUrl || previewUrl || ''} // Use the permanent URL if it exists!
                  alt="Preview"
                  className="w-full h-full object-contain"
                  style={{ maxHeight: '70vh'}}
                />
              ) : (
                // Show a status placeholder during the unstable period
                <div className="h-full flex items-center justify-center text-gray-400">
                    {uploading ? "Uploading..." : "Image Preview"}
                </div>
              )}
            </div>
        </>
      )}
    </>
  );
};