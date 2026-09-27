import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { UnlockForm } from "@/components/voice-lab/UnlockForm";
import { labSecret } from "@/lib/voice/config";
import { isVoiceEngineEnabled } from "@/lib/voice/flag";
import { hasLabAccess, LAB_COOKIE, safeNextPath } from "@/lib/voice/lab-access";

export const dynamic = "force-dynamic";

/**
 * /voice-lab/unlock?next=/voice-lab/...  The one lab page that works without
 * the lab cookie (lab-access.ts). 404 when the flag is off, like the rest.
 */
export default async function UnlockPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  if (!isVoiceEngineEnabled()) notFound();
  const { next } = await searchParams;
  const nextPath = safeNextPath(Array.isArray(next) ? next[0] : next);
  const configured = labSecret() !== null;
  const unlocked = configured && hasLabAccess((await cookies()).get(LAB_COOKIE)?.value);
  return <UnlockForm next={nextPath} configured={configured} unlocked={unlocked} />;
}
