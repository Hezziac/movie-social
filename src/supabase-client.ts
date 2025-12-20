/** [supabase-client.ts]
 * 
 * * The core configuration file for initializing the Supabase client. 
 * This enables the application to communicate with the backend database 
 * and authentication services.
 * * * * SOURCE ATTRIBUTION:
 * This file's structure was originally implemented based on:
 * [PedroTech Social Media Tutorial](https://www.youtube.com/watch?v=_sSTzz13tVY)
 * * * * Note on AI Usage: 
 * - **Deployment Optimization**: GitHub Copilot and Perplexity AI assisted in 
 * refactoring this file to resolve connection issues encountered during 
 * the Vercel deployment process. 
 * - **Error Handling**: AI helped implement the runtime environment variable 
 * checks and the descriptive 'console.error' message. This ensures that 
 * missing API keys are caught immediately with clear instructions on 
 * how to fix them in the hosting provider's settings.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "https://yyblhuywriupksisxazw.supabase.co";

if (!supabaseAnonKey) {
    // Deployment Refactor: AI helped me implement these guardrails to ensure 
    // the app doesn't crash silently if environment variables are missing 
    // on the hosting server (Vercel).
    // Helpful runtime message to make deployments easier to debug
    console.error(
        "Missing VITE_SUPABASE_ANON_KEY environment variable.\n" +
            "Set VITE_SUPABASE_ANON_KEY to your Supabase anon/public key in your .env and in your hosting provider settings.\n" +
            "Do NOT use the service_role key in the browser."
    );
}

export const supabase = createClient(SUPABASE_URL, supabaseAnonKey ?? "");
