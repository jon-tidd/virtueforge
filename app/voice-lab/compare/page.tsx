import { ComparePanel } from "@/components/voice-lab/ComparePanel";
import { listChapters } from "@/lib/voice/chapters";
import { requireLabPage } from "@/lib/voice/lab-page";
import rates from "@/lib/voice/rates.json";
import { defaultThresholds } from "@/lib/voice/rates";
import { listProviders } from "@/lib/voice/registry";
import { getVoiceStorage } from "@/lib/voice/storage";
import { listVoices, toPublic } from "@/lib/voice/voices";

export const dynamic = "force-dynamic";

/** The same chapter in two providers, side by side, with latency, characters and cost. */
export default async function ComparePage() {
  await requireLabPage("/voice-lab/compare");
  const voices = (await listVoices(getVoiceStorage())).filter((v) => v.bindings.length > 0);
  return (
    <ComparePanel
      voices={voices.map(toPublic)}
      providers={listProviders()}
      chapters={await listChapters()}
      charsPerChapter={rates.defaults.charsPerChapter}
      scenarios={rates.defaults.scenarios}
      thresholds={defaultThresholds()}
    />
  );
}
