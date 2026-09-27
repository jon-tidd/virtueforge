import { OwnerPanel } from "@/components/voice-lab/OwnerPanel";
import { requireLabPage } from "@/lib/voice/lab-page";

export const dynamic = "force-dynamic";

/**
 * The voice owner's own page: /voice-lab/owner#<token>. The token stays in the
 * URL fragment (browsers never send it to the server), and OwnerPanel sends it
 * to /api/voice/owner in a header. The off switch and delete live here.
 */
export default async function OwnerPage() {
  await requireLabPage("/voice-lab/owner");
  return <OwnerPanel />;
}
