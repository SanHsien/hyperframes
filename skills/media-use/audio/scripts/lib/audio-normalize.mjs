import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";

// Decode and re-encode cloud audio before publishing it. Feeding the response
// over stdin keeps untrusted network bytes off disk; only ffmpeg's normalized
// output is copied into the requested destination with exclusive creation.
export function normalizeCloudAudio(bytes, destPath) {
  const ext = extname(destPath).toLowerCase();
  if (ext !== ".wav" && ext !== ".mp3") return false;
  mkdirSync(dirname(destPath), { recursive: true });
  const td = mkdtempSync(join(dirname(destPath), ".hf-audio-"));
  const normalized = join(td, `audio${ext}`);
  try {
    const args = ["-y", "-loglevel", "error", "-i", "pipe:0"];
    if (ext === ".wav") args.push("-ar", "44100", "-ac", "1");
    args.push(normalized);
    const ff = spawnSync("ffmpeg", args, {
      input: bytes,
      stdio: ["pipe", "ignore", "ignore"],
      windowsHide: true,
    });
    if (ff.status !== 0 || !existsSync(normalized)) return false;
    rmSync(destPath, { force: true });
    writeFileSync(destPath, readFileSync(normalized), { flag: "wx", mode: 0o600 });
    return true;
  } finally {
    rmSync(td, { recursive: true, force: true });
  }
}
