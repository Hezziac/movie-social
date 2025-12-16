import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../supabase-client"; 
import { useAuth } from "../context/AuthContext"; 

interface CommunityInput {
  title: string; // Use 'title' to match DB column name
  description: string;
  creator_id: string; // Must include the creator's ID
  slug: string; // Add slug for unique URL path
}

// Function now requires the full payload
const createCommunity = async (community: CommunityInput) => {
  // Supabase will automatically handle the 'type' default of 'public' and 'created_at'
  const { error, data } = await supabase.from("communities").insert(community);

  if (error) throw new Error(error.message);
  return data;
};

// Simple utility function to create a URL-friendly slug
const createSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove all non-word chars
    .replace(/[\s_-]+/g, "-") // Replace spaces with -
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing -
};


export const CreateCommunity = () => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const { user } = useAuth(); // Get the current user from context
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate, isPending, isError } = useMutation({
    mutationFn: createCommunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      navigate("/communities");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in to create a community.");
      return;
    }
    
    const slug = createSlug(name);

    // Ensure all required RLS fields and NOT NULL DB fields are sent
    mutate({
      title: name,
      description: description,
      creator_id: user.id, // CRITICAL: This satisfies the RLS policy
      slug: slug // CRITICAL: Required for unique URL/database constraint
    });
  };
  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-6xl font-bold mb-6 text-center bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        Create New Community
      </h2>
      <div>
        <label htmlFor="name" className="block mb-2 font-medium">
          Community Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-white/10 bg-transparent p-2 rounded"
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="block mb-2 font-medium">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-white/10 bg-transparent p-2 rounded"
          rows={3}
        />
      </div>
      <button
        type="submit"
        className="bg-purple-500 text-white px-4 py-2 rounded cursor-pointer"
      >
        {isPending ? "Creating..." : "Create Community"}
      </button>
      {isError && <p className="text-red-500">Error creating community.</p>}
    </form>
  );
};
