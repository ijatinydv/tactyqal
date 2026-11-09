import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getPublicSupabaseConfig } from "@/lib/env/public";
import type { Database } from "@/types/database.generated";

// create an ssr client with request cookies and tolerate read-only render contexts
export async function createServerSupabaseClient(): Promise<SupabaseClient<Database> | null> {
  const config = getPublicSupabaseConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  return createServerClient<Database>(config.supabaseUrl, config.publishableKey, {
    cookies: {
      // expose all session cookies to supabase during this request
      getAll() {
        return cookieStore.getAll();
      },
      // persist refreshed session cookies when the active framework context permits writes
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          return;
        }
      },
    },
  });
}
