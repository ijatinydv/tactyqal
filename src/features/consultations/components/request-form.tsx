"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

// keep form failures safe to display without trusting server internals or returning contact records
 type Failure = { error?: { message?: string; fields?: Record<string, string> } };

// submit one consented adult request while preserving its identity and input through retryable failures
export function RequestForm() {
  const key = useRef<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [receipt, setReceipt] = useState("");

  // prevent double clicks and replay the same database idempotency key after uncertain submission outcomes
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    key.current ??= crypto.randomUUID();
    setPending(true); setError(""); setFields({});
    try {
      const response = await fetch("/api/consultations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        adult_contact_name: data.get("adult_contact_name"), email: data.get("email"), relationship: data.get("relationship"), message: data.get("message"), data_use_acknowledged: data.get("consent") === "on", idempotency_key: key.current, website: data.get("website") ?? "",
      }) });
      const result = await response.json() as Failure & { data?: { receipt_id?: string } };
      if (!response.ok || !result.data?.receipt_id) {
        setFields(result.error?.fields ?? {});
        throw new Error(result.error?.message ?? "The request could not be confirmed. Your details are still in the form; please retry.");
      }
      setReceipt(result.data.receipt_id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The request could not be confirmed. Please retry.");
    } finally { setPending(false); }
  }

  if (receipt) return <div className="rounded-xl border border-control-border bg-surface-muted p-6" role="status"><p className="eyebrow">Request received</p><h2 className="mt-3 font-heading text-3xl">Thanks — we&rsquo;ll be in touch.</h2><p className="mt-4 leading-relaxed">We typically respond within 24 hours.</p><p className="mt-4 break-all text-xs text-muted">Your reference: {receipt}</p><Link href="/" className="mt-6 inline-block text-brand underline">Back to the homepage</Link></div>;
  return <form onSubmit={submit} className="space-y-5 rounded-xl border border-border bg-white p-5 sm:p-8">
    <div><p className="eyebrow">Request a consultation</p><h2 className="mt-2 font-heading text-3xl">Start with what’s on your mind.</h2><p className="mt-3 text-sm leading-relaxed text-muted">All fields are required except the message.</p></div>
    {error && <Alert tone="error">{error}</Alert>}
    <div><label htmlFor="adult-name" className="mb-2 block text-sm font-semibold">Adult contact name</label><Input id="adult-name" name="adult_contact_name" autoComplete="name" required maxLength={120} aria-invalid={Boolean(fields.adult_contact_name)} aria-describedby={fields.adult_contact_name ? "name-error" : undefined} />{fields.adult_contact_name && <p id="name-error" className="mt-2 text-sm text-danger">{fields.adult_contact_name}</p>}</div>
    <div><label htmlFor="contact-email" className="mb-2 block text-sm font-semibold">Email</label><Input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} aria-invalid={Boolean(fields.email)} aria-describedby={fields.email ? "email-error" : undefined} />{fields.email && <p id="email-error" className="mt-2 text-sm text-danger">{fields.email}</p>}</div>
    <div><label htmlFor="relationship" className="mb-2 block text-sm font-semibold">I am a…</label><select id="relationship" name="relationship" required defaultValue="" className="min-h-11 w-full rounded-lg border border-control-border bg-white px-3 py-2"><option value="" disabled>Select your role</option><option value="parent_guardian">Parent or guardian</option><option value="adult_participant">Adult participant</option></select></div>
    <div><label htmlFor="contact-message" className="mb-2 block text-sm font-semibold">What would you like to discuss? <span className="font-normal text-muted">(optional)</span></label><textarea id="contact-message" name="message" maxLength={1500} rows={5} className="w-full rounded-lg border border-control-border px-3 py-2" aria-describedby="message-help" /><p id="message-help" className="mt-2 text-xs leading-relaxed text-muted">A short note is enough. Do not include a child’s name, age, school, or other private information.</p></div>
    <div hidden aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" /></div>
    <label className="flex items-start gap-3 text-sm leading-relaxed"><input name="consent" type="checkbox" required className="mt-1 size-4 shrink-0 accent-brand" /><span>I understand my request will be stored as described in the <Link href="/privacy" className="text-brand underline">privacy notice</Link>. This is not marketing consent.</span></label>
    {fields.data_use_acknowledged && <p className="text-sm text-danger">{fields.data_use_acknowledged}</p>}
    <Button type="submit" disabled={pending} className="w-full">{pending ? "Sending request…" : "Send consultation request"}</Button>
    <p className="text-xs leading-relaxed text-muted">Your request is saved securely for the team to follow up.</p>
  </form>;
}
