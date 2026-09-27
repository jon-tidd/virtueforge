import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { labCookieValue } from "../lab-access";

// Every /voice-lab page and layout must 404 (Next's notFound()) when the flag
// is off, before touching storage, providers or chapters. The page list is
// read from disk, so a new page is covered automatically.

vi.mock("next/font/google", () => {
  const font = () => ({ className: "f", variable: "--f", style: {} });
  return { Figtree: font, Fraunces: font, Literata: font };
});
// Client components are irrelevant here (and may not exist yet mid-build).
vi.mock("@/components/voice-lab/VoiceLab", () => ({ VoiceLab: () => null }));
vi.mock("@/components/voice-lab/ComparePanel", () => ({ ComparePanel: () => null }));
vi.mock("@/components/voice-lab/OwnerPanel", () => ({ OwnerPanel: () => null }));
vi.mock("@/components/voice-lab/ListenPanel", () => ({ ListenPanel: () => null }));
vi.mock("@/components/voice-lab/UnlockForm", () => ({ UnlockForm: () => null }));
// The request's cookies, as next/headers would give them to a page.
const cookieJar = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "gg_voice_lab" && cookieJar.value ? { name, value: cookieJar.value } : undefined) }),
}));

const LAB = path.join(process.cwd(), "app", "voice-lab");
const env = { ...process.env };
afterEach(() => {
  process.env = { ...env };
  cookieJar.value = undefined;
});

function listPages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return listPages(full);
    return /^(page|layout)\.tsx$/.test(name) ? [path.relative(LAB, full).split(path.sep).join("/")] : [];
  });
}

function isNotFound(e: unknown): boolean {
  const digest = (e as { digest?: unknown })?.digest;
  return typeof digest === "string" && (digest === "NEXT_NOT_FOUND" || /^NEXT_HTTP_ERROR_FALLBACK;404$/.test(digest));
}

/** The redirect target, when a page called redirect(). */
function redirectTarget(e: unknown): string | null {
  const digest = (e as { digest?: unknown })?.digest;
  if (typeof digest !== "string" || !digest.startsWith("NEXT_REDIRECT")) return null;
  return digest.split(";")[2] ?? null;
}

type PageFn = (props: Record<string, unknown>) => unknown;
const props = {
  params: Promise.resolve({ token: "t".repeat(43), voiceId: "v_000000000000" }),
  searchParams: Promise.resolve({}),
  children: null,
};

async function outcome(file: string): Promise<"not-found" | "rendered" | string> {
  const mod = (await import(/* @vite-ignore */ path.join(LAB, file))) as { default: PageFn };
  try {
    await mod.default(props);
    return "rendered";
  } catch (e) {
    const to = redirectTarget(e);
    if (to) return `redirect ${to}`;
    return isNotFound(e) ? "not-found" : `threw ${String(e)}`;
  }
}

const PAGES = listPages(LAB).sort();

describe("/voice-lab pages behind the flag", () => {
  it("finds the layout and every page", () => {
    expect(PAGES).toContain("layout.tsx");
    expect(PAGES).toContain("page.tsx");
    expect(PAGES).toContain("compare/page.tsx");
    expect(PAGES.some((p) => p.startsWith("owner/"))).toBe(true);
  });

  it.each(PAGES)("%s calls notFound() when the flag is off", async (file) => {
    delete process.env.VOICE_ENGINE_ENABLED;
    expect(await outcome(file)).toBe("not-found");
  });

  it.each(PAGES)("%s calls notFound() in production even with the flag on", async (file) => {
    process.env.VOICE_ENGINE_ENABLED = "true";
    (process.env as Record<string, string>).NODE_ENV = "production";
    expect(await outcome(file)).toBe("not-found");
  });

  const LOCKED = PAGES.filter((p) => p !== "layout.tsx" && p !== "unlock/page.tsx");

  it.each(LOCKED)("%s sends a browser without the lab cookie to the unlock page (flag on)", async (file) => {
    process.env.VOICE_ENGINE_ENABLED = "true";
    process.env.VOICE_LAB_SECRET = "correct-horse-battery-staple-42";
    cookieJar.value = "not-the-right-cookie";
    expect(await outcome(file)).toMatch(/^redirect \/voice-lab\/unlock\?next=%2Fvoice-lab/);
  });

  it("the unlock page renders with the flag on, and is the only page that does without the cookie", async () => {
    process.env.VOICE_ENGINE_ENABLED = "true";
    expect(await outcome("unlock/page.tsx")).toBe("rendered");
    expect(LOCKED.length).toBeGreaterThanOrEqual(4);
  });

  it.each(["page.tsx", "compare/page.tsx", "owner/page.tsx"])("%s renders with the right lab cookie", async (file) => {
    process.env.VOICE_ENGINE_ENABLED = "true";
    process.env.VOICE_LAB_SECRET = "correct-horse-battery-staple-42";
    cookieJar.value = labCookieValue()!;
    expect(await outcome(file)).toBe("rendered");
  });
});
