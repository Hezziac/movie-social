/** [main.tsx]
 * 
 * * The main entry point for the React application. It initializes the 
 * React DOM, sets up the QueryClient, and configures the global 
 * Authentication and Router providers.
 * * * * SOURCE ATTRIBUTION:
 * This file's structure and Provider setup were implemented based on:
 * [PedroTech Social Media Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)
 * * * * Note on AI Usage: 
 * - **Base Path Configuration**: AI assisted in refactoring the 'Router' 
 * component to include the 'basename' attribute. This was a critical fix 
 * to handle the project's sub-directory hosting on Vite, dynamically 
 * pulling the base path from environment variables.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

import { BrowserRouter as Router } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext.tsx";

const client = new QueryClient();

// Deployment Fix: AI helped refactor this line to ensure the router 
// correctly resolves paths when the app is hosted on a sub-path 
// (e.g., socialcine.vercell.app/movie-social).
const base = (import.meta.env.VITE_BASE_PATH as string | undefined) || undefined;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <Router basename={base}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  </StrictMode>
);
