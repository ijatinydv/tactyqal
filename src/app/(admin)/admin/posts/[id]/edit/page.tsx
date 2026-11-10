import { notFound } from "next/navigation";
import { ConfigurationNotice } from "@/features/auth/components/configuration-notice";
import { requireEditor } from "@/features/auth/server";
import { PostEditor } from "@/features/blog/components/post-editor";
import { getAdminPost } from "@/features/blog/server";

// load an editable saved record only after the editor page verifies the session
export default async function EditAdminPostPage({ params }: { params: Promise<{ id: string }> }) {
  const editor = await requireEditor();
  if (!editor) return <ConfigurationNotice />;
  const { id } = await params;
  const post = await getAdminPost(id);
  if (!post) notFound();
  return <PostEditor initialPost={post} />;
}
