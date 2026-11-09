import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";

// carry verified identity and the request-scoped client through protected server work
export type EditorSession = {
  user: User;
  supabase: SupabaseClient<Database>;
};

// verify the current identity and database-owned editor role on every protected request
export async function requireEditor(): Promise<EditorSession | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  let user: User | null = null;
  let identityVerified = false;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
    identityVerified = !result.error && Boolean(user);
  } catch {
    identityVerified = false;
  }
  if (!identityVerified || !user) redirect("/login?reason=sessionexpired");

  let role: string | null = null;
  let roleVerified = false;
  try {
    const result = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    role = result.data?.role ?? null;
    roleVerified = !result.error && role === "editor";
  } catch {
    roleVerified = false;
  }
  if (!roleVerified) redirect("/login?reason=denied");

  return { user, supabase };
}
