import { guarded, json } from "@/lib/voice/http";
import { defaultProviderId, listProviders } from "@/lib/voice/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/voice/providers -> which adapters exist and which have keys. Never returns keys. */
export const GET = guarded(async () => json({ providers: listProviders(), defaultProvider: defaultProviderId() }));
