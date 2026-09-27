import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isVoiceEngineEnabled } from "./flag";
import { hasLabAccess, LAB_COOKIE, safeNextPath } from "./lab-access";

/**
 * The first line of every /voice-lab page (except the unlock page itself):
 * no flag -> 404 (the lab doesn't exist); no lab cookie -> the unlock page.
 * Checked per page, not only in the layout, because the layout also wraps the
 * unlock page and isn't re-run on every client-side navigation.
 */
export async function requireLabPage(path: string): Promise<void> {
  if (!isVoiceEngineEnabled()) notFound();
  const jar = await cookies();
  if (!hasLabAccess(jar.get(LAB_COOKIE)?.value)) {
    redirect(`/voice-lab/unlock?next=${encodeURIComponent(safeNextPath(path))}`);
  }
}
