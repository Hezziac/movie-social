/** [Home.tsx]
 * 
 * * The main landing page of the application that serves as the primary "feed" 
 * view by rendering the PostList.
 * * * * SOURCE ATTRIBUTION:
 * This component's structure was originally followed from:
 * [PedroTech Social Media Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)
 * * * * Note on AI Usage: 
 * - **Mobile Optimization**: GitHub Copilot and Perplexity AI assisted in 
 * refactoring the layout to a 'fixed' position (top-16 to bottom-0). This 
 * ensures the feed fills the entire screen perfectly between the Navbar 
 * and the bottom of the device, mimicking a native mobile app.
 * - **Viewport Management**: AI suggested adding the 'maximum-scale=1.0' 
 * meta tag to prevent the browser from zooming in when users interact with 
 * the feed, which was a critical part of the mobile design choice.
 */

import { PostList } from "../components/PostList";

export const Home = () => {
  return (
    <div className="fixed top-16 bottom-0 left-0 right-0">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"></meta>
      <PostList />
    </div>
  );
};
