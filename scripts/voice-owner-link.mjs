#!/usr/bin/env node
// Family story voice: a new owner link for a voice on this machine.
//
//   npm run voice:owner-link -- <voiceId> [--base http://localhost:3000]
//
// The owner link is the only way to switch a voice off or delete it, and it is
// shown once. If it is lost, this issues a fresh one: it replaces the stored
// owner-token hash in VOICE_DATA_DIR/voices/<id>/voice.json and prints the new
// /voice-lab/owner#<token> link once. The old link stops working. Nothing is
// sent anywhere. Dev machine only: it refuses unless VOICE_ENGINE_ENABLED=true
// (read from .env.local) and never in production. Best run with the dev server
// idle (not in the middle of making or deleting that voice).

import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

const VOICE_ID_RE = /^v_[A-Za-z0-9_-]{12}$/;

function fail(msg) {
  process.stderr.write(`voice-owner-link: ${msg}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
let voiceId = "";
let base = "http://localhost:3000";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--base") base = args[++i] ?? base;
  else if (args[i] === "-h" || args[i] === "--help") {
    process.stdout.write("Usage: npm run voice:owner-link -- <voiceId> [--base http://localhost:3000]\n");
    process.exit(0);
  } else voiceId = args[i];
}

if (process.env.VOICE_ENGINE_ENABLED !== "true" || process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
  fail("the voice engine flag is off (VOICE_ENGINE_ENABLED=true in .env.local, never production).");
}
if (!VOICE_ID_RE.test(voiceId)) fail("give a voice id like v_AbCdEfGhIjKl (listed on /voice-lab).");

const dataDir = process.env.VOICE_DATA_DIR || path.join(process.cwd(), ".voice-data");
const file = path.join(dataDir, "voices", voiceId, "voice.json");
if (!existsSync(file)) fail(`no voice ${voiceId} in ${dataDir}.`);
const voice = JSON.parse(readFileSync(file, "utf8"));
if (voice.deleting) fail("that voice is being deleted.");

const token = randomBytes(32).toString("base64url");
voice.ownerTokenHash = createHash("sha256").update(token).digest("hex");
voice.updatedAt = new Date().toISOString();
const tmp = `${file}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
writeFileSync(tmp, JSON.stringify(voice, null, 2) + "\n", { mode: 0o600 });
renameSync(tmp, file);

process.stdout.write(
  `New owner link for ${voice.ownerName?.split(/\s+/)[0] ?? "this"}'s voice (shown once; the old link no longer works):\n\n` +
    `  ${base.replace(/\/$/, "")}/voice-lab/owner#${token}\n\n`,
);
