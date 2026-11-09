import { ConfigurationNotice } from "@/features/auth/components/configuration-notice";
import { requireEditor } from "@/features/auth/server";

// keep consultation requests private until the editor inbox is connected to real records
export default async function AdminInquiriesPage() {
  const editor = await requireEditor();
  if (!editor) return <ConfigurationNotice />;

  return (
    <section aria-labelledby="inquiries-heading">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand">Private inbox</p>
      <h1 id="inquiries-heading" className="section-heading mt-3">Inquiries</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
        Consultation requests will appear here when the private inbox is connected. No personal sample records or pretend reply actions are shown.
      </p>
    </section>
  );
}
