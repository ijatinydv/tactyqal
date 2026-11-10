"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

// limit private client state to the documented adult request fields required for editorial review
 type Inquiry = { id: string; adult_contact_name: string; email: string; relationship: string; message: string | null; status: "new" | "reviewed" | "closed"; created_at: string; updated_at: string };

// show real requests only after the protected api verifies the editor role on every operation
export function InquiryInbox() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("new");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const selected = items.find(item => item.id === selectedId);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page) });
    if (filter) params.set("status", filter);
    fetch(`/api/admin/inquiries?${params}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error?.message ?? "Requests could not be loaded. Please sign in again if your session expired.");
        setItems(payload.data.items); setTotal(payload.data.total); setPageSize(payload.data.pageSize); setError("");
      })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Requests could not be loaded."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, filter, reload]);

  // let editors review or remove a single persisted record without inventing email or booking actions
  async function mutate(remove: boolean) {
    if (!selected || pending) return;
    if (remove && !window.confirm(`Delete the request from ${selected.adult_contact_name}? Its stored contact details will be removed.`)) return;
    setPending(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/inquiries/${selected.id}`, { method: remove ? "DELETE" : "PATCH", headers: { "Content-Type": "application/json" }, ...(remove ? {} : { body: JSON.stringify({ status }) }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? "This request could not be updated. Please retry.");
      setNotice(remove ? "Request deleted." : "Status updated.");
      if (remove) { setSelectedId(""); setPage(1); }
      setReload(value => value + 1);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "This request could not be updated."); }
    finally { setPending(false); }
  }

  return <section aria-labelledby="inbox-heading"><p className="eyebrow">Private adult contact requests</p><h1 id="inbox-heading" className="section-heading mt-3">A conversation starts here.</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">Synthetic demo requests only. Review and organise them here; this workspace does not send email or schedule appointments.</p>
    <div className="mt-6 flex flex-wrap items-end gap-4"><label className="text-sm font-semibold">Filter by status<select aria-label="Filter by status" className="mt-2 block min-h-11 rounded-lg border border-control-border bg-white px-3" value={filter} onChange={event => { setFilter(event.target.value); setPage(1); setLoading(true); setSelectedId(""); }}><option value="">All requests</option><option value="new">New</option><option value="reviewed">Reviewed</option><option value="closed">Closed</option></select></label><p className="pb-3 text-sm text-muted">{loading ? "Loading requests…" : `${total} request${total === 1 ? "" : "s"}`}</p></div>
    {error && <div className="mt-5 space-y-3"><Alert tone="error">{error}</Alert><Button variant="secondary" onClick={() => { setLoading(true); setReload(value => value + 1); }}>Retry loading</Button></div>}
    {notice && <div className="mt-5"><Alert tone="success">{notice}</Alert></div>}
    {!loading && !error && items.length === 0 && <div className="mt-8 rounded-xl border border-border bg-white p-8"><h2 className="font-heading text-2xl">No requests here yet.</h2><p className="mt-3 text-sm text-muted">Requests matching this filter will appear after a successful submission. No sample contacts are invented.</p></div>}
    <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><div className="space-y-3">{items.map(item => <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setStatus(item.status); setNotice(""); }} className={`w-full rounded-xl border p-4 text-left ${item.id === selectedId ? "border-brand bg-surface-muted" : "border-border bg-white"}`} aria-pressed={item.id === selectedId}><span className="block font-semibold">{item.adult_contact_name}</span><span className="mt-1 block break-all text-sm text-muted">{item.email}</span><span className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted"><span className="capitalize">{item.status}</span><span>{new Date(item.created_at).toLocaleDateString("en-GB", { timeZone: "UTC" })}</span></span></button>)}</div>
      {selected && <article className="self-start rounded-xl border border-control-border bg-white p-5 sm:p-6"><p className="eyebrow">Request details</p><h2 className="mt-3 font-heading text-3xl">{selected.adult_contact_name}</h2><p className="mt-2 break-all text-sm text-muted">{selected.email}</p><p className="mt-3 text-sm text-muted">{selected.relationship === "parent_guardian" ? "Parent or guardian" : "Adult participant"}</p><p className="mt-6 whitespace-pre-wrap break-words leading-relaxed">{selected.message || "No message supplied."}</p><label htmlFor="inquiry-status" className="mt-7 block text-sm font-semibold">Status</label><select id="inquiry-status" value={status} onChange={event => setStatus(event.target.value)} disabled={pending} className="mt-2 min-h-11 w-full rounded-lg border border-control-border bg-white px-3"><option value="new">New</option><option value="reviewed">Reviewed</option><option value="closed">Closed</option></select><div className="mt-5 flex flex-wrap gap-3"><Button onClick={() => void mutate(false)} disabled={pending}>{pending ? "Updating…" : "Save status"}</Button><Button variant="destructive" onClick={() => void mutate(true)} disabled={pending}>Delete request</Button></div><p className="mt-4 text-xs text-muted">Deleting removes this request’s contact record. No reply or appointment is created by changing its status.</p></article>}
    </div>
    {total > pageSize && <nav aria-label="Request pages" className="mt-7 flex flex-wrap items-center gap-4"><Button variant="secondary" disabled={page <= 1 || loading} onClick={() => { setPage(value => value - 1); setLoading(true); setSelectedId(""); }}>Previous</Button><p className="text-sm">Page {page} of {Math.ceil(total / pageSize)}</p><Button variant="secondary" disabled={page * pageSize >= total || loading} onClick={() => { setPage(value => value + 1); setLoading(true); setSelectedId(""); }}>Next</Button></nav>}
  </section>;
}
