import { ChangeEvent, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { Community, fetchCommunities } from "./CommunityList";

// Define the structure of a post's input data
interface PostInput {
  title: string; // Title of the post
  content: string; // Content/body of the post
  avatar_url: string | null;
  community_id?: number | null;
}

// Function to create a post with an image
const createPost = async (post: PostInput, imageFile: File) => {
  // Step 1: Upload the image to Supabase storage
  // Generate a unique file path for the image using the post title and current timestamp
  const filePath = `${post.title}-${Date.now()}-${imageFile.name}`;

  // Upload the image file to the "post-images" bucket in Supabase storage
  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(filePath, imageFile);

  // Throw an error if the upload fails
  if (uploadError) throw new Error(uploadError.message);

  // Step 2: Get the public URL for the uploaded image
  const { data: publicURLData } = supabase.storage
    .from("post-images")
    .getPublicUrl(filePath);

  // Step 3: Insert the post data into the "posts" table in Supabase database
  const { data, error } = await supabase.from("posts").insert({
    ...post, // Spread the title and content into the database entry
    image_url: publicURLData.publicUrl, // Add the public URL of the uploaded image to the post entry

  });

  // Throw an error if inserting into the database fails
  if (error) throw new Error(error.message);

  // Return the inserted post data (success)
  return data;
};

// React component for creating a post
export const CreatePost = () => {
  // State variables for form inputs
  const [title, setTitle] = useState<string>(""); // Title of the post
  const [content, setContent] = useState<string>(""); // Content/body of the post
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Selected image file
  const [communityid, setCommunityId] = useState<number | null>(null); // Selected community input

  const { user } = useAuth();

  // query for Communitys in DB
  const { data: communities} = useQuery<Community[], Error>({
    queryKey: ["communities"],
    queryFn: fetchCommunities,
  });

  // Mutation hook for handling asynchronous post creation logic
  const { mutate, isPending, isError } = useMutation({
    mutationFn: (data: { post: PostInput; imageFile: File }) => {
      return createPost(data.post, data.imageFile); // Call createPost function with form data and selected file
    },
  });

  // Handle form submission when "Create Post" button is clicked
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission behavior (page reload)
    if (!selectedFile) return; // Ensure an image file is selected before proceeding

    // Trigger mutation to create a post with title, content, and selected image file
    mutate({
      post: {
        title,
        content,
        avatar_url: user?.user_metadata.avatar_url || null,
        community_id: communityid,
      },
      imageFile: selectedFile,
    });
  };

  // Handle file selection when user selects an image file from their device
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]); // Update state with selected file
    }
  };

  const handleCommunityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCommunityId(value ? Number(value): null);
  };


  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
      {/* Input field for post title */}
      <div>
        <label className="block mb-2 font-medium" htmlFor="title">
          Title
        </label>
        <input
          type="text"
          id="title"
          required // Makes this field mandatory in form submission
          onChange={(event) => setTitle(event.target.value)} // Update state when user types in this field
          className="w-full border border-white/10 bg-transparent p-2 rounded"
        />
      </div>

      {/* Textarea for post content */}
      <div>
        <label htmlFor="content" className="block mb-2 font-medium">
          Content
        </label>
        <textarea
          id="content"
          required // Makes this field mandatory in form submission
          rows={5} // Sets height of textarea to accommodate multiple lines of text
          onChange={(event) => setContent(event.target.value)} // Update state when user types in this field
          className="w-full border border-white/10 bg-transparent p-2 rounded"
        />
      </div>

      <div>
        <label>Select Community</label>
        <select id="community" onChange={handleCommunityChange}>
            <option value={""}>-- Choose a Community --</option>
            {communities?.map((community, key) => (
                <option key={key} value={community.id}>
                    {community.name}
                </option>
            ))}
        </select>
      </div>

      {/* File input for uploading an image */}
      <div>
        <label htmlFor="image" className="block mb-2 font-medium">
          Upload Image
        </label>
        <input
          type="file"
          id="image"
          accept="image/*" // Restrict file selection to images only (e.g., jpg, png)
          required // Makes this field mandatory in form submission
          onChange={handleFileChange} // Update state when user selects a file from their device
          className="w-full text-gray-200"
        />
      </div>

      {/* Submit button to create a new post */}
      <button
        type="submit"
        className="bg-purple-500 text-white px-4 py-2 rounded cursor-pointer"
      >
        {isPending ? "Creating..." : "Create Post"}
      </button>

      {isError && <p className="text-red-500">Error creating post.</p>}
    </form>
  );
};
