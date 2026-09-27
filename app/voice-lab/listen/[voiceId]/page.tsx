import { notFound } from "next/navigation";
import { ListenPanel } from "@/components/voice-lab/ListenPanel";
import { listChapters } from "@/lib/voice/chapters";
import { requireLabPage } from "@/lib/voice/lab-page";
import { listProviders } from "@/lib/voice/registry";
import { getVoiceStorage } from "@/lib/voice/storage";
import { getVoice, toPublic } from "@/lib/voice/voices";

export const dynamic = "force-dynamic";

export default async function ListenPage({ params }: { params: Promise<{ voiceId: string }> }) {
  const { voiceId } = await params;
  await requireLabPage(`/voice-lab/listen/${/^v_[A-Za-z0-9_-]{12}$/.test(voiceId) ? voiceId : ""}`);
  const voice = await getVoice(getVoiceStorage(), voiceId);
  if (!voice || voice.deleting) notFound();
  return <ListenPanel voice={toPublic(voice)} providers={listProviders()} chapters={await listChapters()} />;
}
