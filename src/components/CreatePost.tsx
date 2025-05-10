import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { Community, fetchCommunities } from "./CommunityList";
import { MovieSearchModal } from "./MovieSearchModal";
import { Movie } from "../context/tmdb-client";
import { useNavigate } from "react-router";

interface PostInput {
  title: string;
  content: string;
  avatar_url: string | null;
  community_id?: number | null;
  movie_id?: number | null;
}

export const CreatePost = () => {
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [communityId, setCommunityId] = useState<number | null>(null);

  // Movie selection state
  const [showMovieSearch, setShowMovieSearch] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // Nav togo to home page after complete data upload
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  // Refs and hooks
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { data: communities } = useQuery<Community[], Error>({
    queryKey: ["communities"],
    queryFn: fetchCommunities,
  });

  // Movie selection handler
  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setShowMovieSearch(false);
  };

  // Tag highlighting
  const highlightTags = (text: string) => {
    return text.split(/(#[a-zA-Z0-9_]+)/g).map((part, i) =>
      part.startsWith("#") ? (
        <span key={i} className="text-blue-400">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Cursor position handling
  useEffect(() => {
    if (textareaRef.current) {
      const cursorPos = textareaRef.current.selectionStart;
      textareaRef.current.setSelectionRange(cursorPos, cursorPos);
    }
  }, [content]);

  // Post creation mutation
  const { mutate, isPending, isError } = useMutation({
    mutationFn: async (data: { post: PostInput; imageFile: File }) => {
      const sanitizedTitle = data.post.title.replace(/[^a-zA-Z0-9-_]/g, "-");
      const filePath = `post-images/${sanitizedTitle}-${Date.now()}-${
        data.imageFile.name
      }`;

      // Upload image
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(filePath, data.imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError)
        throw new Error("Failed to upload image: " + uploadError.message);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("post-images").getPublicUrl(filePath);

      // Extract tags from content
      const tagNames =
        data.post.content
          .match(/#[a-zA-Z0-9_]+/g)
          ?.map((tag) => tag.slice(1).toLowerCase())
          .filter(Boolean) || [];

      // Handle TMDB movie insertion if selected
      let movieId = null;
      if (selectedMovie) {
        const { error: movieError } = await supabase.from("movies").upsert(
          {
            id: selectedMovie.id,
            title: selectedMovie.title,
            release_date: selectedMovie.release_date,
            poster_path: selectedMovie.poster_path,
          },
          {
            onConflict: "id",
          }
        );

        if (movieError) {
          console.error("Failed to upsert movie:", movieError);
        } else {
          movieId = selectedMovie.id;
        }
      }

      // Create the post
      const { data: createdPost, error: postError } = await supabase
        .from("posts")
        .insert({
          title: data.post.title,
          content: data.post.content,
          image_url: publicUrl,
          avatar_url: data.post.avatar_url,
          community_id: data.post.community_id,
          movie_id: movieId,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Process tags if any exist
      if (tagNames.length > 0) {
        // Upsert all tags
        const { error: tagError } = await supabase.from("tags").upsert(
          tagNames.map((name) => ({
            name,
            slug: name.toLowerCase().replace(/[^\w]+/g, "-"),
          })),
          { onConflict: "name" }
        );

        if (tagError) throw tagError;

        // Get all tag IDs
        const { data: tags, error: tagsError } = await supabase
          .from("tags")
          .select("id")
          .in("name", tagNames);

        if (tagsError) throw tagsError;

        // Create post-tag relationships
        if (tags && tags.length > 0) {
          const { error: relationError } = await supabase
            .from("post_tags")
            .insert(
              tags.map((tag) => ({
                post_id: createdPost.id,
                tag_id: tag.id,
              }))
            );

          if (relationError) throw relationError;
        }
      }

      return createdPost;
    },
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => navigate("/"), 2000); // Navigate after 2 seconds
    },
    onError: (error) => {
      console.error("Post creation failed:", error);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) return;

    mutate({
      post: {
        title,
        content,
        avatar_url: user?.user_metadata.avatar_url || null,
        community_id: communityId,
        movie_id: selectedMovie?.id || null,
      },
      imageFile: selectedFile,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
      {/* Title Input */}
      <div>
        <label className="block mb-2 font-medium" htmlFor="title">
          Title
        </label>
        <input
          type="text"
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-white/10 bg-transparent p-2 rounded"
        />
      </div>

      {/* Content Textarea with Tag Highlighting */}
      <div>
        <label htmlFor="content" className="block mb-2 font-medium">
          Content
        </label>
        <div className="relative">
          <div className="absolute inset-0 p-2 whitespace-pre-wrap pointer-events-none overflow-hidden">
            {highlightTags(content)}
          </div>
          <textarea
            ref={textareaRef}
            id="content"
            required
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-white/10 bg-transparent p-2 rounded text-transparent caret-white"
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Type #tags directly in your text (e.g., #movie #review)
        </p>
      </div>

      {/* Community Select */}
      <div>
        <label className="block mb-2">Select Community</label>
        <select
          id="community"
          onChange={(e) =>
            setCommunityId(e.target.value ? Number(e.target.value) : null)
          }
          className="w-full border border-white/10 bg-transparent p-2 rounded"
        >
          <option value="">-- Choose a Community --</option>
          {communities?.map((community) => (
            <option key={community.id} value={community.id}>
              {community.name}
            </option>
          ))}
        </select>
      </div>

      {/* Image Upload */}
      <div>
        <label htmlFor="image" className="block mb-2 font-medium">
          Upload Image
        </label>
        <input
          type="file"
          id="image"
          accept="image/*"
          required
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="w-full text-gray-200"
        />
      </div>

      {/* Movie Selection */}
      <div className="space-y-2">
        <label className="block font-medium">Associated Movie (optional)</label>
        {selectedMovie ? (
          <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg group">
            {selectedMovie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w92${selectedMovie.poster_path}`}
                alt={selectedMovie.title}
                className="w-12 h-auto rounded"
              />
            ) : (
              <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center">
                <span className="text-xs text-gray-400">No image</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{selectedMovie.title}</p>
              <p className="text-sm text-gray-400 truncate">
                {selectedMovie.release_date?.split("-")[0]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMovie(null)}
              className="ml-auto text-gray-400 hover:text-white transition-colors"
              aria-label="Remove movie"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowMovieSearch(true)}
            className="w-full border-2 border-dashed border-gray-700 hover:border-purple-500 rounded-lg p-4 text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>Add a Movie</span>
          </button>
        )}
      </div>

      {/* Movie Search Modal */}
      <MovieSearchModal
        isOpen={showMovieSearch}
        onClose={() => setShowMovieSearch(false)}
        onSelect={handleMovieSelect}
      />

      {isSuccess && (
        <div className="bg-green-500 text-white p-4 rounded mb-4">
          Post created successfully! Redirecting...
        </div>
      )}

      {isError && <p className="text-red-500">Error creating post.</p>}


      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || isSuccess}
        className="bg-purple-500 text-white px-4 py-2 rounded cursor-pointer disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create Post"}
      </button>
    </form>
  );
};
