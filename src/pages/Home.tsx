
import { PostList } from "../components/PostList";

export const Home = () => {
  return (
    <div className="fixed top-16 bottom-0 left-0 right-0">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"></meta>
      <PostList />
    </div>
  );
};
