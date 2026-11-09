import { z } from "zod";

// describe the browser-safe supabase connection needed for ssr authentication
const publicSupabaseEnvironmentSchema = z.object({
  supabaseUrl: z.string().trim().url(),
  publishableKey: z.string().trim().min(1),
});

// keep missing or malformed public settings from breaking builds and page rendering
export function getPublicSupabaseConfig() {
  const parsed = publicSupabaseEnvironmentSchema.safeParse({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!parsed.success) return null;

  const protocol = new URL(parsed.data.supabaseUrl).protocol;
  return protocol === "http:" || protocol === "https:" ? parsed.data : null;
}
