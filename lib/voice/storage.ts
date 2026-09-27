import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { voiceDataDir } from "./config";

// A small key/value file store. Keys are relative paths like
// "voices/<id>/voice.json". The local implementation writes under
// VOICE_DATA_DIR (default ./.voice-data, gitignored). A Supabase Storage
// implementation can replace it later without touching the engine
// (see engine-design.md, "Replacing local storage with Supabase").

export interface VoiceStorage {
  read(key: string): Promise<Uint8Array | null>;
  write(key: string, data: Uint8Array | string): Promise<void>;
  readJson<T>(key: string): Promise<T | null>;
  writeJson(key: string, value: unknown): Promise<void>;
  /** Appends one line (for ledger.jsonl). */
  appendLine(key: string, line: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  /** Deletes one key. Returns true if something was deleted. */
  delete(key: string): Promise<boolean>;
  /** Deletes every key under a prefix ("voices/<id>/"). Returns how many files went. */
  deletePrefix(prefix: string): Promise<number>;
  /** Lists keys directly or deeply under a prefix. */
  list(prefix: string): Promise<string[]>;
}

const KEY_RE = /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*\/?$/;

export function assertSafeKey(key: string): void {
  if (!KEY_RE.test(key) || key.split("/").some((p) => p === "." || p === "..")) {
    throw new Error(`unsafe storage key: ${JSON.stringify(key)}`);
  }
}

export class LocalVoiceStorage implements VoiceStorage {
  constructor(private readonly root: string) {}

  private resolve(key: string): string {
    assertSafeKey(key);
    const full = path.resolve(/* turbopackIgnore: true */ this.root, key);
    const root = path.resolve(/* turbopackIgnore: true */ this.root);
    if (full !== root && !full.startsWith(root + path.sep)) {
      throw new Error("storage key escapes the data directory");
    }
    return full;
  }

  async read(key: string): Promise<Uint8Array | null> {
    try {
      return new Uint8Array(await fs.readFile(/* turbopackIgnore: true */ this.resolve(key)));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }

  async write(key: string, data: Uint8Array | string): Promise<void> {
    const full = this.resolve(key);
    await fs.mkdir(/* turbopackIgnore: true */ path.dirname(full), { recursive: true });
    // Write then rename so a crash never leaves half a file in the cache.
    // Random suffix: two writes to the same key in the same millisecond must not share a temp file.
    const tmp = `${full}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
    await fs.writeFile(/* turbopackIgnore: true */ tmp, data, { mode: 0o600 });
    await fs.rename(/* turbopackIgnore: true */ tmp, full);
  }

  async readJson<T>(key: string): Promise<T | null> {
    const bytes = await this.read(key);
    if (!bytes) return null;
    return JSON.parse(Buffer.from(bytes).toString("utf8")) as T;
  }

  async writeJson(key: string, value: unknown): Promise<void> {
    await this.write(key, JSON.stringify(value, null, 2) + "\n");
  }

  async appendLine(key: string, line: string): Promise<void> {
    const full = this.resolve(key);
    await fs.mkdir(/* turbopackIgnore: true */ path.dirname(full), { recursive: true });
    await fs.appendFile(/* turbopackIgnore: true */ full, line.replace(/\n/g, " ") + "\n", { mode: 0o600 });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(/* turbopackIgnore: true */ this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await fs.unlink(/* turbopackIgnore: true */ this.resolve(key));
      return true;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return false;
      throw e;
    }
  }

  async deletePrefix(prefix: string): Promise<number> {
    const keys = await this.list(prefix);
    let n = 0;
    for (const k of keys) if (await this.delete(k)) n++;
    const dir = this.resolve(prefix.replace(/\/$/, ""));
    await fs.rm(/* turbopackIgnore: true */ dir, { recursive: true, force: true });
    return n;
  }

  async list(prefix: string): Promise<string[]> {
    const base = this.resolve(prefix.replace(/\/$/, "") || ".");
    const out: string[] = [];
    const walk = async (dir: string) => {
      let entries: import("node:fs").Dirent[];
      try {
        entries = await fs.readdir(/* turbopackIgnore: true */ dir, { withFileTypes: true });
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
        throw e;
      }
      for (const ent of entries) {
        const full = path.join(/* turbopackIgnore: true */ dir, ent.name);
        if (ent.isDirectory()) await walk(full);
        else if (!ent.name.endsWith(".tmp")) {
          out.push(path.relative(path.resolve(this.root), full).split(path.sep).join("/"));
        }
      }
    };
    await walk(base);
    return out.sort();
  }
}

export function getVoiceStorage(): VoiceStorage {
  return new LocalVoiceStorage(voiceDataDir());
}
