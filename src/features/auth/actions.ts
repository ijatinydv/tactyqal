"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import type { LoginActionState } from "./types";
import { getPublicSupabaseConfig } from "@/lib/env/public";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireEditor } from "./server";

// reject malformed credentials before contacting the invitation-only auth service
const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254, "Email must be 254 characters or fewer."),
  password: z.string().min(1, "Enter your password.").max(1024, "Password is too long."),
});

// sign in invited accounts without exposing credential-specific auth responses
export async function loginAction(previousState: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const email = typeof rawEmail === "string" ? rawEmail : previousState.email;

  if (!getPublicSupabaseConfig()) {
    return {
      email,
      message: "Editor authentication is not configured. Set the required public Supabase settings and try again.",
      messageKind: "error",
      fieldErrors: {},
    };
  }

  const parsed = loginSchema.safeParse({ email, password: rawPassword });
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      email: email.trim(),
      message: null,
      messageKind: null,
      fieldErrors: {
        email: errors.email?.[0],
        password: errors.password?.[0],
      },
    };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      email: parsed.data.email,
      message: "Editor authentication is not configured. Set the required public Supabase settings and try again.",
      messageKind: "error",
      fieldErrors: {},
    };
  }

  let signedInUser: User | null = null;
  let credentialsRejected = false;
  try {
    const result = await supabase.auth.signInWithPassword(parsed.data);
    signedInUser = result.data.user;
    credentialsRejected = Boolean(result.error) || !signedInUser;
  } catch {
    credentialsRejected = true;
  }
  if (credentialsRejected || !signedInUser) {
    return {
      email: parsed.data.email,
      message: "Unable to sign in with those credentials.",
      messageKind: "error",
      fieldErrors: {},
    };
  }

  let authenticatedUser: User | null = null;
  let identityVerified = false;
  try {
    const result = await supabase.auth.getUser();
    authenticatedUser = result.data.user;
    identityVerified = !result.error && Boolean(authenticatedUser);
  } catch {
    identityVerified = false;
  }
  if (!identityVerified || !authenticatedUser) {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      return {
        email: parsed.data.email,
        message: "Unable to verify the signed-in session. Please try again.",
        messageKind: "error",
        fieldErrors: {},
      };
    }
    return {
      email: parsed.data.email,
      message: "Unable to verify the signed-in session. Please try again.",
      messageKind: "error",
      fieldErrors: {},
    };
  }

  let role: string | null = null;
  let roleCheckFailed = false;
  try {
    const result = await supabase.from("profiles").select("role").eq("id", authenticatedUser.id).maybeSingle();
    role = result.data?.role ?? null;
    roleCheckFailed = Boolean(result.error);
  } catch {
    roleCheckFailed = true;
  }
  if (roleCheckFailed || role !== "editor") {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      return {
        email: parsed.data.email,
        message: roleCheckFailed ? "Editor access could not be verified. Please try again." : "This account does not have editor access.",
        messageKind: "error",
        fieldErrors: {},
      };
    }
    return {
      email: parsed.data.email,
      message: roleCheckFailed ? "Editor access could not be verified. Please try again." : "This account does not have editor access.",
      messageKind: "error",
      fieldErrors: {},
    };
  }

  redirect("/admin");
}

// end only the freshly verified editor session through a form post
export async function logoutAction(): Promise<never> {
  const editor = await requireEditor();
  if (!editor) redirect("/login?reason=configuration");

  let signOutFailed = false;
  try {
    const result = await editor.supabase.auth.signOut({ scope: "local" });
    signOutFailed = Boolean(result.error);
  } catch {
    signOutFailed = true;
  }

  redirect(signOutFailed ? "/login?reason=signoutfailed" : "/login?reason=signedout");
}
