
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { PostItem } from "./PostItem";
import { Movie } from "../context/tmdb-client";


export interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  image_url: string;
  avatar_url?: string;
  like_count?: number;
  comment_count?: number;
  movie_id?: number | null;
  movie?: Movie;
}

const fetchPosts = async (): Promise<(Post & { movie?: Movie })[]> => {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      movie:movie_id (*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

export const PostList = () => {
  const { data, error, isLoading } = useQuery<Post[], Error>({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  if (isLoading) {
    return <div> Loading posts...</div>;
  }

  if (error) {
    return <div> Error: {error.message}</div>;
  }

  console.log(data);

  return (
    <div className="flex flex-wrap gap-6 justify-center">
      {data?.map((post, key) => (
        <PostItem post={post} key={key} />
      ))}
    </div>
  );
};
