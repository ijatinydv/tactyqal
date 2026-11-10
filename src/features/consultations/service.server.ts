import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { HttpError } from "@/lib/http/error";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";
import { CONSULTATION_PAGE_SIZE } from "./shared";
import type { ConsultationInquiry, ConsultationList, ConsultationStatus, SubmitConsultationInput } from "./types";

// retain the request client after checking a database-owned editor role
type EditorContext = { user: User; client: SupabaseClient<Database> };

// provide a stable error when private inquiry storage cannot be reached
function unavailable(): HttpError {
  return new HttpError(503, "SERVICE_UNAVAILABLE", "Consultation requests are temporarily unavailable");
}

// deny inbox access unless the current identity has a verified editor profile
async function authenticateEditor(): Promise<EditorContext> {
  let client: SupabaseClient<Database> | null;
  try {
    client = await createServerSupabaseClient();
  } catch {
    throw unavailable();
  }
  if (!client) throw unavailable();

  let user: User | null = null;
  try {
    const identity = await client.auth.getUser();
    if (!identity.error) user = identity.data.user;
  } catch {
    user = null;
  }
  if (!user) throw new HttpError(401, "UNAUTHENTICATED", "Sign in to access consultation requests");

  try {
    const profile = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile.error) throw unavailable();
    if (profile.data?.role !== "editor") throw new HttpError(403, "FORBIDDEN", "Editor access is required");
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw unavailable();
  }
  return { user, client };
}

// submit through the narrow anonymous database writer without exposing inbox rows
export async function submitConsultation(input: SubmitConsultationInput): Promise<{ receipt_id: string }> {
  const client = createPublicSupabaseClient();
  if (!client) throw unavailable();

  const rpcClient = client as unknown as {
    rpc(name: string, args: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }>;
  };
  const { data, error } = await rpcClient.rpc("submit_consultation", {
    p_idempotency_key: input.idempotency_key,
    p_adult_contact_name: input.adult_contact_name,
    p_email: input.email,
    p_relationship: input.relationship,
    p_message: input.message || null,
    p_data_use_acknowledged: input.data_use_acknowledged,
  });
  if (error) {
    if (error.message.includes("CONSULTATION_RATE_LIMIT")) {
      throw new HttpError(429, "RATE_LIMITED", "Too many requests. Please try again later.");
    }
    if (error.message.includes("CONSULTATION_IDEMPOTENCY_CONFLICT")) {
      throw new HttpError(409, "IDEMPOTENCY_CONFLICT", "This request key was already used with different details.");
    }
    if (error.message.includes("CONSULTATION_INVALID")) {
      throw new HttpError(422, "VALIDATION_ERROR", "Please check the submitted fields.");
    }
    throw unavailable();
  }
  if (typeof data !== "string") throw unavailable();
  return { receipt_id: data };
}

// return a bounded editor inbox without exposing database errors or caller roles
export async function listConsultationInquiries(options: { status?: ConsultationStatus; page: number }): Promise<ConsultationList> {
  const { client } = await authenticateEditor();
  const from = (options.page - 1) * CONSULTATION_PAGE_SIZE;
  const to = from + CONSULTATION_PAGE_SIZE - 1;
  let query = client.from("consultation_requests").select("id,adult_contact_name,email,relationship,message,data_use_acknowledged,status,created_at,updated_at", { count: "exact" });
  if (options.status) query = query.eq("status", options.status);
  const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error) throw unavailable();
  return {
    items: (data ?? []) as ConsultationInquiry[],
    total: count ?? 0,
    page: options.page,
    pageSize: CONSULTATION_PAGE_SIZE,
  };
}

// change one inbox state only after independently verifying editor access
export async function updateConsultationInquiryStatus(id: string, status: ConsultationStatus): Promise<ConsultationInquiry> {
  const { client } = await authenticateEditor();
  const { data, error } = await client.from("consultation_requests").update({ status }).eq("id", id)
    .select("id,adult_contact_name,email,relationship,message,data_use_acknowledged,status,created_at,updated_at").maybeSingle();
  if (error) throw unavailable();
  if (!data) throw new HttpError(404, "NOT_FOUND", "Consultation request not found");
  return data as ConsultationInquiry;
}

// remove one private inquiry only after independently verifying editor access
export async function deleteConsultationInquiry(id: string): Promise<{ id: string }> {
  const { client } = await authenticateEditor();
  const { data, error } = await client.from("consultation_requests").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw unavailable();
  if (!data) throw new HttpError(404, "NOT_FOUND", "Consultation request not found");
  return { id: data.id };
}
