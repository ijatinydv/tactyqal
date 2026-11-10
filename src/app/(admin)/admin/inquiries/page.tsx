import { requireEditor } from "@/features/auth/server";
import { ConfigurationNotice } from "@/features/auth/components/configuration-notice";
import { InquiryInbox } from "@/features/consultations/components/inquiry-inbox";

// protect private contact rendering independently of client navigation and proxy refresh
export default async function InquiriesPage() {
  const editor = await requireEditor();
  if (!editor) return <ConfigurationNotice />;
  return <InquiryInbox />;
}
