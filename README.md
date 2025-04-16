# Social Media App - Movies with Friends

## Overview

This project is a social media application with a core focus on watching and discussing movies with friends. Inspired by platforms like Instagram and Reddit, it aims to create a space where users can share their thoughts, plan movie nights, and connect over their favorite films. However, you're not limited to movies - feel free to post memes, tag your friends, and talk about whatever you like!

## Features

-   **Posts:** Share your thoughts, photos, and memes with friends.
-   **Tagging:** Tag friends in your posts.
-   **Movie Integration:** Search for and add movies to your posts.
-   **Groups:** Create and join communities for specific interests.
-   **Followers/Friends:** Connect with other users.
-   **Profiles:** Customize your profile settings.
-   **Group Watch:** Plan movie nights with friends (future feature).

## Inspiration

This project was heavily inspired by PedroTech's Social Media App tutorial on YouTube:

[Social Media App Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)

I was looking for a project to learn TypeScript and this tutorial came at the perfect time. While the tutorial provides a solid foundation, I'm building upon it to create my unique vision for a movie-focused social media experience.

## Technologies Used

-   [React](https://reactjs.org/)
-   [TypeScript](https://www.typescriptlang.org/)
-   [Vite](https://vitejs.dev/)
-   [Supabase](https://supabase.com/)
-   [PostgreSQL](https://www.postgresql.org/)
-   [Tailwind CSS](https://tailwindcss.com/)

## Database Structure (as of time of writing this)
posts_tags
PK post_id int8 NOT NULL
PK tag_id int8 NOT NULL
created_at timestampz

movies
PK id int8
created_at timestampz
title text NOT NULL
poster_url text
release_date date
overview text

movie_genres
PK movie_id int8 REF movies(id)
PK genre_id int8 REF genres(id)

tags
PK id int8
name text
slug text
created_at timestampz

genres
PK id int8
name text NOT NULL


## Contributing and Testing

The project is currently in the early stages of development (MVP) and will be released to a small group of testers first.

If you're interested in:

-   **Becoming a beta tester** when the MVP is released
-   **Helping with development**
-   **Offering suggestions**

Please contact me at <Hezziac@gmail.com>

I'm learning TypeScript as I go, so any help or advice is greatly appreciated!

idk why but imma keep this below for now.
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
