/** [PostPage.tsx]
 * 
 * * A page-level routing component that displays a single post in full detail.
 * * * * SOURCE ATTRIBUTION:
 * This component's structure and the use of 'useParams' to handle dynamic 
 * routing for individual posts were based on:
 * [PedroTech Social Media Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)
 */

import { useParams } from "react-router";
import { PostDetail } from "../components/PostDetail";

export const PostPage = () => {
    const {id} = useParams<{id: string}>()
  return (
    <div className="pt-10">
      <PostDetail postId={Number(id)}/>
    </div>
  );
};
