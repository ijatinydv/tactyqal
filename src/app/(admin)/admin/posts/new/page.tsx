import { ConfigurationNotice } from "@/features/auth/components/configuration-notice";
import { requireEditor } from "@/features/auth/server";
import { PostEditor } from "@/features/blog/components/post-editor";

// create a new article only inside the independently authorized editor workspace
export default async function NewAdminPostPage() {
  const editor = await requireEditor();
  if (!editor) return <ConfigurationNotice />;
  return <PostEditor />;
}
