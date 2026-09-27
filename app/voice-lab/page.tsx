import { VoiceLab } from "@/components/voice-lab/VoiceLab";
import { listChapters } from "@/lib/voice/chapters";
import { minConsentSeconds, minSampleSeconds } from "@/lib/voice/config";
import { CONSENT_SCRIPT_VERSION } from "@/lib/voice/consent-text";
import { GUIDED_PASSAGES } from "@/lib/voice/guided-reading";
import { requireLabPage } from "@/lib/voice/lab-page";
import { childrenPhrase, loadFamily } from "@/lib/voice/personalize";
import { defaultProviderId, listProviders } from "@/lib/voice/registry";
import { getVoiceStorage } from "@/lib/voice/storage";
import { listVoices, retryPendingDeletionsSoon, toPublic } from "@/lib/voice/voices";

export const dynamic = "force-dynamic";

export default async function VoiceLabPage() {
  await requireLabPage("/voice-lab");
  const family = await loadFamily();
  const storage = getVoiceStorage();
  // Provider deletes that failed earlier are retried whenever the lab opens (at most every 10 min).
  retryPendingDeletionsSoon(storage);
  const [voices, chapters] = await Promise.all([listVoices(storage), listChapters()]);
  return (
    <VoiceLab
      childrenPhrase={childrenPhrase(family)}
      consentScriptVersion={CONSENT_SCRIPT_VERSION}
      // The passages keep the sample names: they only need to capture how the
      // adult reads, and the children's real names never go into the clone's
      // training audio. (The consent statement, which the provider never gets,
      // does name them.)
      passages={[...GUIDED_PASSAGES]}
      providers={listProviders()}
      defaultProvider={defaultProviderId()}
      voices={voices.map(toPublic)}
      chapterId={chapters.find((c) => c.id === "s1-ch01")?.id ?? chapters[0]?.id ?? "s1-ch01"}
      minSampleSeconds={minSampleSeconds()}
      minConsentSeconds={minConsentSeconds()}
    />
  );
}
