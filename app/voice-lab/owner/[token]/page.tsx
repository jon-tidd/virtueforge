import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isVoiceEngineEnabled } from "@/lib/voice/flag";
import { hasLabAccess, LAB_COOKIE } from "@/lib/voice/lab-access";

export const dynamic = "force-dynamic";

/**
 * Older owner links put the token in the path (/voice-lab/owner/<token>).
 * Move it into the fragment (/voice-lab/owner#<token>) so it stops appearing
 * in request lines, history and logs from here on. Only well-formed tokens are
 * forwarded; the owner page itself checks the token against the voice.
 */
export default async function LegacyOwnerPage({ params }: { params: Promise<{ token: string }> }) {
  if (!isVoiceEngineEnabled()) notFound();
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) notFound();
  const jar = await cookies();
  // Without the lab cookie, go through the unlock page; the token rides along in the fragment.
  if (!hasLabAccess(jar.get(LAB_COOKIE)?.value)) redirect(`/voice-lab/unlock?next=%2Fvoice-lab%2Fowner#${token}`);
  redirect(`/voice-lab/owner#${token}`);
}
