import { ConfigurationNotice } from "@/features/auth/components/configuration-notice";
import { requireEditor } from "@/features/auth/server";
import { PostList } from "@/features/blog/components/post-list";

// protect the real post browser independently of the surrounding admin layout
export default async function AdminPostsPage() {
  const editor = await requireEditor();
  if (!editor) return <ConfigurationNotice />;
  return <PostList />;
}
