 /* [CreatePost.tsx]
 * 
 * Contains the CreatePost component and the createPost functions.
 * Component is used to create a new post with optional image, community, and movie associations.
 * Handles form submission, image uploads, community selection, and movie associations.
 * Uses React Query for fetching communities and handling mutations.
 * Includes a movie search modal for associating movies with posts.
 * * * SOURCE ATTRIBUTION:
 * This file was originally provided by the following tutorial:
 * [PedroTech Social Media Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)
 * Adapted significantly to handle custom Movie associations and Tagging features.
 * * * Note on AI Usage: 
 * - **Tagging System**: GitHub Copilot and Perplexity AI assisted in implementing 
 * the regex-based tag highlighting and the 'upsert' logic for the tags database.
 * - **Movie Data Persistence**: AI helped implement the 'upsert' pattern for TMDB 
 * movies to ensure movie data exists in my local database as a backup for the API.
 * - **Refactoring**: Used AI to bridge my data structure with the tutorial's 
 * base logic and ensured TypeScript type safety.
 */
import { useState, useRef, useEffect } from "react";
import { ImageUploader } from "../components/ImageUploader";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { Community, fetchCommunities } from "../components/CommunityList"; // Assuming components are here
import { MovieSearchModal } from "../components/MovieSearchModal";
import { Movie } from "../context/tmdb-client";
import { useNavigate } from "react-router";
import { AspectRatio } from "../context/AspectRatios";

interface PostInput {
  title: string;
  content: string;
  avatar_url: string | null;
  community_id?: number | null; // CORRECT: ID is BigInt/number in DB
  movie_id?: number | null;
  image_url?: string | null;
  aspect_ratio?: string | null;
  user_id: string;
}

export const CreatePost = () => {
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  // FIX: State should be number | null to match DB bigint
  const [communityId, setCommunityId] = useState<number | null>(null);

  // ImageUploader state
  const [imageUrl, setImageUrl] = useState<string | null>(null); // This holds the Supabase public URL
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>("original");
  
  // Movie selection state
  const [showMovieSearch, setShowMovieSearch] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // Nav to go to home page after complete data upload
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  
  // Refs and hooks
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);

  // Fetch profile for the logged-in user
  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .eq('id', userId)
        .single();
      if (!profileError && profileData) {
        setProfile(profileData);
      } else {
        setProfile(null);
      }
    };
    if (user?.id) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
    }
  }, [user]);

  // Fetch communities for the dropdown
  // NOTE: Assuming CommunityList has been fixed to return { id: int8(number), title: string,description: string, created_at: uuid, type: string, slug: string }
  // TODO: Add image_url to Community type
  const { data: communities, isLoading: isLoadingCommunities, isError: isErrorCommunities } = useQuery<Community[], Error>({
    queryKey: ["communities"],
    queryFn: fetchCommunities,
  });

  // Movie selection handler
  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setShowMovieSearch(false);
  };

  // Tag highlighting logic: Refactored with Perplexity AI to use regex 
  // for identifying #tags and styling them differently than plain text.
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
    mutationFn: async (data: { post: PostInput }) => {
      // Extract tags from content
      const tagNames =
        data.post.content
          .match(/#[a-zA-Z0-9_]+/g)
          ?.map((tag) => tag.slice(1).toLowerCase())
          .filter(Boolean) || [];

      // Movie persistence logic: Assisted by AI to implement an 'upsert' pattern.
      // This ensures that even if the TMDB API is unavailable, the movie details
      // are cached in our own 'movies' table once a user has referenced them.
      let movieId: number | null = null;
      if (selectedMovie) {
        const { error: movieError } = await supabase.from("movies").upsert(
          {
            id: selectedMovie.id,
            title: selectedMovie.title,
            release_date: selectedMovie.release_date || null,
            poster_path: selectedMovie.poster_path,
            overview: selectedMovie.overview || null,
          },
          {
            onConflict: "id",
          }
        );
        if (!movieError) {
          movieId = selectedMovie.id;
        } else {
          // Logging the specific error for better debugging
          console.error("Supabase Movie Upsert Failed:", movieError);
        }
      }

      // Create the post
      const { data: createdPost, error: postError } = await supabase
        .from("posts")
        .insert({
          title: data.post.title,
          content: data.post.content,
          image_url: imageUrl, // Use imageUrl from ImageUploader, Uses the Supabase public URL
          avatar_url: data.post.avatar_url,
          community_id: data.post.community_id,
          movie_id: movieId, // number (BigInt) or null
          aspect_ratio: selectedAspectRatio,
          user_id: data.post.user_id,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Process tags if any exist
      if (tagNames.length > 0) {
        const { error: tagError } = await supabase.from("tags").upsert(
          tagNames.map((name) => ({
            name,
            slug: name.toLowerCase().replace(/[^\w]+/g, "-"),
          })),
          { onConflict: "name" }
        );
        if (tagError) throw tagError;

        const { data: tags, error: tagsError } = await supabase
          .from("tags")
          .select("id")
          .in("name", tagNames);
        if (tagsError) throw tagsError;

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
      setTimeout(() => navigate("/"), 2000);
    },
    onError: (error) => {
      console.error("Post creation failed:", error);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !profile) {
      console.error("User or profile not loaded when attempting to create post.");
      return;
    }
    mutate({
      post: {
        title,
        content,
        avatar_url: profile.avatar_url || user?.user_metadata?.avatar_url || null,
        community_id: communityId,
        movie_id: selectedMovie?.id ?? null,
        aspect_ratio: selectedAspectRatio,
        user_id: profile.id,
      },
    });
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {/* Title Input */}
      <div>
        <label className="block mb-2 font-medium text-gray-200" htmlFor="title">
          Title
        </label>
        <input
          type="text"
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-700 bg-gray-900 text-white p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Give your post a title"
        />
      </div>

      {/* Content Textarea with Tag Highlighting */}
      <div>
        <label htmlFor="content" className="block mb-2 font-medium text-gray-200">
          Content
        </label>
        <div className="relative">
          <div className="absolute inset-0 p-3 whitespace-pre-wrap pointer-events-none overflow-hidden">
            {highlightTags(content)}
          </div>
          <textarea
            ref={textareaRef}
            id="content"
            required
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-gray-700 bg-gray-900 p-3 rounded-lg text-transparent caret-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Share your thoughts... Use #tags to categorize your post"
          />
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Pro tip: Posts with images get 2.5x more engagement!
        </p>
      </div>

      {/* Community Select */}
      <div>
        <label className="block mb-2 text-gray-200">Select Community</label>
        <select
          id="community"
          onChange={(e) =>
            setCommunityId(e.target.value ? Number(e.target.value) : null)
          }
          className="w-full border border-gray-700 bg-gray-900 text-white p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          disabled={isLoadingCommunities || isErrorCommunities}
        >
          <option value="">
            {isLoadingCommunities
              ? "Loading Communities..."
              : isErrorCommunities
              ? "Error loading communities"
              : "-- Choose a Community --"}
          </option>
          {communities?.map((community) => (
            <option key={community.id} value={community.id}>
              {community.title}
            </option>
          ))}
        </select>
        {isErrorCommunities && <p className="text-red-500 mt-2">Error loading communities. Check your console for details.</p>}
      </div>

      {/* ImageUploader handles image upload, aspect ratio, and preview */}
      <ImageUploader
        onImageChange={(_file, url, aspectRatio) => {
          setImageUrl(url);
          setSelectedAspectRatio(aspectRatio);
        }}
      />

      {/* Movie Selection */}
      <div className="space-y-2">
        <label className="block font-medium text-gray-200">Associated Movie (optional)</label>
        {selectedMovie ? (
          <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg border border-gray-800">
            {selectedMovie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w92${selectedMovie.poster_path}`}
                alt={selectedMovie.title}
                className="w-12 h-auto rounded"
              />
            ) : (
              <div className="w-12 h-16 bg-gray-800 rounded flex items-center justify-center">
                <span className="text-xs text-gray-400">No image</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{selectedMovie.title}</p>
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

      {/* Status Messages */}
      {isSuccess && (
        <div className="bg-green-600/20 border border-green-500 text-green-100 p-4 rounded-lg mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Post created successfully! Redirecting...
        </div>
      )}

      {isError && (
        <div className="bg-red-600/20 border border-red-500 text-red-100 p-4 rounded-lg mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Error creating post. Please try again.
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending || isSuccess}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            "Create Post"
          )}
        </button>
      </div>
    </form>
    <div className="pt-16"></div>
    </>
  );
};