import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join } from "node:path";

const OUTPUT_FORMATS = new Map([
  [".ico", "ico"],
  [".png", "image2"],
]);

// Decode and re-encode a cloud image before publishing it. The response is fed
// to ffmpeg over stdin, so malformed or polyglot source bytes never become the
// saved asset.
export function normalizeCloudImage(bytes, destPath) {
  const ext = extname(destPath).toLowerCase();
  const format = OUTPUT_FORMATS.get(ext);
  if (!format) return false;
  mkdirSync(dirname(destPath), { recursive: true });
  const td = mkdtempSync(join(dirname(destPath), ".hf-image-"));
  const normalized = join(td, `image${ext}`);
  try {
    const ff = spawnSync(
      "ffmpeg",
      ["-y", "-loglevel", "error", "-i", "pipe:0", "-frames:v", "1", "-f", format, normalized],
      {
        input: bytes,
        stdio: ["pipe", "ignore", "ignore"],
        windowsHide: true,
      },
    );
    if (ff.status !== 0 || !existsSync(normalized)) return false;
    rmSync(destPath, { force: true });
    writeFileSync(destPath, readFileSync(normalized), { flag: "wx", mode: 0o600 });
    return true;
  } finally {
    rmSync(td, { recursive: true, force: true });
  }
}
