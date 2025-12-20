/**
 * [CreatePostPage.tsx]
 * * A page-level component that serves as the container for the 
 * 'CreatePost' form logic. 
 * * * * SOURCE ATTRIBUTION:
 * This component's structure was implemented based on:
 * [PedroTech Social Media Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)
 */
import { CreatePost } from "../components/CreatePost";

export const CreatePostPage = () => {
  return (
    <div className="pt-20 px-4">
      <h2 className="text-4xl md:text-6xl font-bold mb-6 text-center bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        Create New Post
      </h2>
      <CreatePost />
    </div>
  );
};