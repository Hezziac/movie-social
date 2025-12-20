# Social.Cine
#### Video Demo:  <URL HERE>
#### Live Application: [https://socialcine.vercel.app/](https://socialcine.vercel.app/)

#### Description:
**Social.Cine** is a specialized social media platform built for movie enthusiasts. It combines the visual appeal of a modern photo-sharing app with the community-driven structure of a forum. The project was born from the idea that movie discussions deserve a dedicated space where film data—like posters, release dates, and director info—is integrated directly into the social experience.

This project represents a significant personal milestone. I have spent over **9 months** working on this application, iterating on the design and logic. While it is submitted here as my CS50 Final Project, it is a "living" project that I intend to continue building and updating as a long-term hobby.

The platform draws inspiration from the feed-based model of Instagram and the community-driven structure of Reddit, but with every feature built specifically to enhance the movie-watching experience.

### Key Features:
* **User Authentication & Onboarding:** A custom-built flow ensures every user establishes a unique identity and username before entering the feed.
* **The "Creation Hub":** A centralized UI portal that reduces navigation clutter by housing both Post and Community creation tools.
* **Dynamic Movie Integration:** Using the TMDB API, users can tag specific films in their posts, which automatically pulls in high-quality posters and metadata.
* **Communities:** Users can create and join genre-specific groups (e.g., "Horror Fanatics") to connect with people sharing niche interests.
* **Responsive Media Grid:** An Instagram-inspired 3-column profile grid with hover effects for likes and comments, optimized specifically for mobile viewports.

---

## File Breakdown and Functionality

To meet the requirements of a complex full-stack application, the following files were authored and refactored:

### Core & Configuration
* **`App.tsx`**: The central traffic controller. It manages all routes and includes a "Profile Verification Gate" to ensure new users are funneled to onboarding.
* **`main.tsx`**: The entry point that initializes the React DOM and configures the `BrowserRouter` with dynamic base-path logic for deployment.
* **`supabase-client.ts`**: Handles the connection to the backend, including specialized error handling for Vercel environment variables.
* **`index.css`**: Contains global styles and advanced mobile optimizations, such as Dynamic Viewport Height (`dvh`) and iOS safe-area inset management.
* **`DATABASE SETUP.txt`**: A reference log of the SQL schema used to build the relational database, including Many-to-Many joining tables.

### Context & Logic
* **`AuthContext.tsx`**: Manages the global authentication state. It handles the transition from Supabase's auth events to the application's internal user state.
* **`tmdb-client.ts`**: A specialized API client that communicates with The Movie Database to fetch real-time film data.
* **`useProfileData.ts`**: A custom hook that centralizes the heavy lifting of fetching profile stats, user posts, and social relationship statuses.

### Pages & Views
* **`Home.tsx`**: The landing page that renders the main social feed.
* **`ProfilePage.tsx`**: A high-fidelity profile view featuring a 3-column media grid and conditional "Edit/Follow" logic.
* **`ProfileSetupPage.tsx`**: The onboarding gate that handles initial username generation and profile creation.
* **`MovieSearchPage.tsx`**: An interactive search interface for browsing the TMDB database.
* **`CreationHubPage.tsx`**: A custom navigation portal designed to simplify the user experience.
* **`CommunitiesPage.tsx` & `CommunityPage.tsx`**: Handle the display of genre-specific groups and their unique feeds.

### Components
* **`NavBar.tsx`**: A responsive navigation bar that adapts based on the user's authentication status.
* **`PostList.tsx` & `PostDetail.tsx`**: The primary engines for rendering feed content and deep-dive post views.
* **`ProfileEditForm.tsx`**: A dedicated interface for users to update their bios and avatars.

---

## Design Choices and Technical Rationale

The choice of technology for this project was deliberate, with the goal of building a modern, performant, and scalable application.

* **React & TypeScript:** I chose React to build a dynamic, single-page application (SPA). TypeScript was used to add a layer of type safety, which was crucial for a project of this size. It helped catch common errors during development and made the codebase easier to maintain.
* **Supabase (PostgreSQL):** Rather than building a custom backend from scratch, I chose Supabase. This allowed me to focus on the "Instagram-look" and core social features without getting bogged down in server-side boilerplate. The relational structure of PostgreSQL is ideal for managing complex relationships between users, posts, and communities.
* **Tailwind CSS:** For styling, I utilized Tailwind CSS. Its utility-first approach allowed me to rapidly build the UI. I spent considerable time refactoring the CSS to handle mobile "safe-area" insets and dynamic viewport heights to ensure the app feels like a native mobile application.
* **AI Collaboration:** Throughout the 9-month development, I utilized GitHub Copilot and Perplexity AI as "pair programmers." They were instrumental in refactoring the `App.tsx` routing logic and debugging complex redirect loops during the onboarding phase.

---

## Database Structure

* `profiles`: Stores user data linked to Supabase Auth.
* `posts`: The primary table for all user content.
* `communities`: Stores genre-specific group information.
* `movies`: Caches data from the TMDB API to optimize performance.
* `post_movies`: A join table managing the many-to-many relationship between posts and films.

---

## Future Vision

Social.Cine is a project I am deeply passionate about. My future roadmap includes:
* **Group Watch:** Implementing real-time group streaming functionality using WebRTC.
* **Enhanced Lists:** Allowing users to create "Watched" and "Want to Watch" lists.
* **Advanced Discovery:** A recommendation engine based on user following and liked genres.

---

## Important Note for CS50 Graders:

This project is the culmination of my journey through CS50. It demonstrates a move from basic programming into professional full-stack architecture. By integrating third-party APIs with a custom-built relational database, I have created a platform that is both technically robust and visually polished. I am proud to share that after 9 months of hard work, the application is live and functional.

Thank you for your consideration.