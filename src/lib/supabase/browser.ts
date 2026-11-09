"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/lib/env/public";
import type { Database } from "@/types/database.generated";

// provide a cookie-aware browser client only when public project settings are valid
export function createBrowserSupabaseClient(): SupabaseClient<Database> | null {
  const config = getPublicSupabaseConfig();
  if (!config) return null;

  return createBrowserClient<Database>(config.supabaseUrl, config.publishableKey);
}
