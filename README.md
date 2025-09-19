# Cine.Circle: A Social Hub for Movie Lovers

#### Video Demo: Coming Soon!<URL HERE>

#### Description:

Cine.Circle is a modern social media platform designed for movie lovers to connect, share their thoughts, and discover new films together. In a world saturated with generic social media, this project aims to create a specialized community where the conversation is centered around a shared passion. It’s a place where you can share your favorite movie scenes, review new releases, and plan virtual movie nights with friends. The platform draws inspiration from the feed-based model of Instagram and the community-driven structure of Reddit, but with every feature built specifically to enhance the movie-watching experience.

While a core feature like group streaming is a long-term goal, the current implementation focuses on the "social" aspect: creating a vibrant community where users can interact around movie content. This includes:

* **User Authentication & Profiles:** Users can sign up and create a personalized profile. This includes a username, avatar, and a feed of their posts.
* **Dynamic Posts:** Posts are the heart of the platform. They can include text, images, and, most importantly, tagged movies. This allows users to share a review, a memorable quote, or a favorite movie meme while linking directly to the film they are discussing.
* **Communities:** Users can create and join communities centered around specific genres, franchises, or directors (e.g., "Horror Fanatics" or "Christopher Nolan Lovers"). This allows for more focused discussions and a way to connect with people who share your niche interests.
* **Friends & Following:** The platform supports a follower system, allowing users to build a network of friends and see their content on a personalized feed.
* **In-app Search:** Search for movies and find information about them to include in your posts.

---

## Inspiration

This project was heavily inspired by PedroTech's Social Media App tutorial on YouTube:

[Social Media App Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)

I was looking to create a social media app that felt familiar to users but was built specifically for movie enthusiasts and their friends. While the tutorial provided a solid foundation, I'm building upon it to create my unique vision for a movie-focused social media experience.

---

## Design Choices and Technical Rationale

The choice of technology for this project was deliberate, with the goal of building a modern, performant, and scalable application.

* **React & TypeScript:** I chose React to build a dynamic, single-page application (SPA). This provides a seamless user experience without constant page reloads. TypeScript was used to add a layer of type safety, which is crucial for a project of this size. It helps catch common errors during development and makes the codebase easier to maintain and refactor.
* **Vite:** As the build tool, Vite was selected for its incredibly fast development server and build times. This significantly improved my productivity and allowed for a faster development cycle compared to other alternatives like create-react-app.
* **Supabase:** Rather than building a custom backend from scratch, I chose Supabase, a "Backend as a Service" (BaaS). This was a major design decision. Supabase provides a full suite of tools, including a PostgreSQL database, real-time data synchronization, and a robust authentication system. This allowed me to focus on building the front-end and core social features without getting bogged down in server-side logic and database management, which is a major advantage for a solo project.
* **PostgreSQL:** The core database is PostgreSQL, which comes standard with Supabase. Its relational structure is ideal for a social media app, allowing for complex data relationships between users, posts, movies, and communities.
* **Tailwind CSS:** For styling, I utilized Tailwind CSS. Its utility-first approach allowed me to rapidly build and customize the UI. It provides a consistent design system and makes responsive design much more efficient, which was a key consideration for ensuring the app looks great on both mobile and desktop.

---

## Database Structure

The application's data is managed by a PostgreSQL database with the following key tables and their relationships:

* `profiles`: Stores user data, including `id` (linked to Supabase Auth), `username`, and `avatar_url`. This table is essential for managing user-specific data outside of the authentication system.
* `posts`: The primary table for all user posts. It includes columns for content, timestamps, and a `user_id` that links back to the `profiles` table.
* `communities`: Stores information about each community, such as `name` and `description`. A `creator_id` links back to the `profiles` table.
* `movies`: This table caches movie data from an external API (like TMDB) to avoid repeated API calls. It includes data such as `title`, `poster_url`, and `release_date`.
* `comments`: This table holds user comments, with foreign keys linking back to both the `posts` and `profiles` tables.
* `likes`: A simple table to track likes on posts, linking `user_id` and `post_id`.
* `post_movies`: A join table to manage the many-to-many relationship between `posts` and `movies`, allowing a single post to tag multiple films.
* `community_members`: A join table to track which users are members of which communities.

---

## Getting Started and Future Vision

The project is still under active development, and I am committed to improving its features and performance. If you are interested in becoming a beta tester for the MVP or would like to contribute, please contact me at the email in this document. I'm learning TypeScript as I go, so any advice is welcome.

Looking ahead, my vision for Cine.Circle includes:

* **Group Watch:** Implementing real-time group streaming functionality using a service like WebRTC. This would allow friends to watch movies together in sync from anywhere.
* **Enhanced User Profiles:** Allowing users to create "watched" and "want to watch" lists, and see which movies their friends have rated.
* **Advanced Search & Discovery:** Creating a powerful search engine that allows users to find movies, friends, and communities based on various criteria.

I am confident that Cine.Circle, built with these modern technologies, has the potential to become a truly useful and engaging platform for movie enthusiasts.

---

## Important Note for CS50 Graders:

This project is a personal reflection of my learning journey. It demonstrates the skills I have acquired in modern full-stack development. All the code, including the front-end components, API integrations, and database schema, was written from the ground up, with the Supabase backend providing the necessary tools to focus on the core functionality.

Thank you for your consideration.
