import Link from "next/link";
import { Alert } from "@/components/ui/alert";

// reserve a truthful editorial entry point until invited account authentication is delivered
export default function LoginPage() {
  return <main id="main-content" className="page-container max-w-xl py-20"><Link href="/" className="wordmark">tactyqal</Link><h1 className="section-heading mt-10">A space for the editorial team.</h1><div className="mt-8"><Alert>Invited-editor authentication is delivered in Chunk 05. No credentials are accepted at this stage.</Alert></div><Link href="/" className="mt-8 inline-block text-sm text-brand underline">Return to the site</Link></main>;
}
