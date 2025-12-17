// supabase-client.ts
import { createClient } from "@supabase/supabase-js";

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "https://yyblhuywriupksisxazw.supabase.co";

if (!supabaseAnonKey) {
    // Helpful runtime message to make deployments easier to debug
    console.error(
        "Missing VITE_SUPABASE_ANON_KEY environment variable.\n" +
            "Set VITE_SUPABASE_ANON_KEY to your Supabase anon/public key in your .env and in your hosting provider settings.\n" +
            "Do NOT use the service_role key in the browser."
    );
}

export const supabase = createClient(SUPABASE_URL, supabaseAnonKey ?? "");
