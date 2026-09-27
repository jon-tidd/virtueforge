import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { defineConfig, type Plugin } from "vitest/config";

const root = import.meta.dirname;

/**
 * The page tests mock every client component under components/voice-lab/.
 * While a component is still being written, its import would fail to resolve
 * before the mock applies; this resolves such an import to an empty module so
 * the mock can take over. Type checking (tsc) still reports the missing file.
 */
function missingVoiceLabComponents(): Plugin {
  const PREFIX = "@/components/voice-lab/";
  const VIRTUAL = "\0missing-voice-lab-component:";
  return {
    name: "missing-voice-lab-components",
    enforce: "pre",
    resolveId(id) {
      const dir = path.join(root, "components", "voice-lab") + path.sep;
      let rest: string;
      if (id.startsWith(PREFIX)) rest = id.slice(PREFIX.length);
      else if (id.startsWith(dir)) rest = id.slice(dir.length); // after the "@" alias
      else return null;
      const base = path.join(dir, rest);
      const exists = ["", ".tsx", ".ts", "/index.tsx", "/index.ts"].some((ext) => existsSync(base + ext));
      return exists ? null : VIRTUAL + PREFIX + rest;
    },
    load(id) {
      return id.startsWith(VIRTUAL) ? "export {};" : null;
    },
  };
}

export default defineConfig({
  plugins: [missingVoiceLabComponents()],
  resolve: {
    alias: { "@": root },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "app/**/*.test.ts", "scripts/**/*.test.ts"],
    restoreMocks: true,
    env: {
      // Tests read the bundled fixture chapter, never real chapter files or a
      // real family file, and never write into the repo's .voice-data/.
      STORY_CONTENT_DIR: path.join(root, "lib", "voice", "__fixtures__", "__no-content__"),
      VOICE_DATA_DIR: path.join(os.tmpdir(), "gg-voice-vitest-default"),
      VOICE_FAMILY_FILE: "",
      VOICE_ENGINE_ENABLED: "",
      VOICE_PURGE_PROVIDER_HISTORY: "",
      // Tests that need the lab secret set their own; a developer's shell must not leak in.
      VOICE_LAB_SECRET: "",
      VOICE_MIN_CONSENT_SECONDS: "",
      VOICE_MIN_SAMPLE_SECONDS: "",
      CHATTERBOX_URL: "",
      CHATTERBOX_TOKEN: "",
      FAL_KEY: "",
      ELEVENLABS_API_KEY: "",
    },
  },
});
