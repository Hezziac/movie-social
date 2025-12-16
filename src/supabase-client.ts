// supabase-client.ts
import { createClient } from "@supabase/supabase-js";

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const SUPABASE_URL = "https://yyblhuywriupksisxazw.supabase.co"; // can also put in env file

// debugs
// if (!SUPABASE_URL) console.log("Missing Supabase URL");
// if (!import.meta.env.VITE_SUPABASE_ANON_KEY) console.log("Missing Anon Key");

export const supabase = createClient(
    SUPABASE_URL,
    supabaseAnonKey
);
