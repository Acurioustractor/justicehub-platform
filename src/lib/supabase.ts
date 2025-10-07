import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Get these from your Supabase project settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file"
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);