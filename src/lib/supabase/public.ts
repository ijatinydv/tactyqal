import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/lib/env/public";
import type { Database } from "@/types/database.generated";

// create an anonymous uncookied client so public reads never inherit editor sessions
export function createPublicSupabaseClient() {
  const config = getPublicSupabaseConfig();
  if (!config) return null;

  return createClient<Database>(config.supabaseUrl, config.publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
