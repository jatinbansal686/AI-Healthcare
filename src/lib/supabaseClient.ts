import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are in your .env file",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true, // stores session in localStorage automatically
    detectSessionInUrl: true, // handles OAuth redirects
    storageKey: "hs-auth", // explicit key avoids conflicts with other apps on same localhost
  },
});
