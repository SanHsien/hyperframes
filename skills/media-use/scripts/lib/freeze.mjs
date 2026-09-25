import { fetchMedia, isPublicMediaUrl } from "./media-fetch.mjs";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCube } from "./cube-validate.mjs";

const PUBLISHER = fileURLToPath(new URL("./freeze-publisher.mjs", import.meta.url));

// ponytail: bound the download so a hostile/runaway URL can't fill the disk.
// 256MB covers any real media asset; raise if 4K video sources ever exceed it.
const MAX_FREEZE_BYTES = 256 * 1024 * 1024;

function startsWith(bytes, signature) {
  return signature.every((value, index) => bytes[index] === value);
}

function isIsoBaseMedia(bytes) {
  return bytes.length >= 12 && bytes.subarray(4, 8).toString("ascii") === "ftyp";
}

/** Verify that remote bytes match the media type selected by the reservation. */
export function assertRemoteMediaBytes(bytes, destination) {
  const ext = extname(destination).toLowerCase();
  const ascii = (start, end) => bytes.subarray(start, end).toString("ascii");
  let valid = false;
  switch (ext) {
    case ".png":
      valid = startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      break;
    case ".jpg":
    case ".jpeg":
      valid = startsWith(bytes, [0xff, 0xd8, 0xff]);
      break;
    case ".gif":
      valid = ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a";
      break;
    case ".webp":
      valid = ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
      break;
    case ".wav":
      valid = ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE";
      break;
    case ".ogg":
      valid = ascii(0, 4) === "OggS";
      break;
    case ".flac":
      valid = ascii(0, 4) === "fLaC";
      break;
    case ".mp3":
      valid = ascii(0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
      break;
    case ".aac":
      valid = bytes[0] === 0xff && (bytes[1] & 0xf6) === 0xf0;
      break;
    case ".mp4":
    case ".m4a":
    case ".m4v":
    case ".mov":
      valid = isIsoBaseMedia(bytes);
      break;
    case ".webm":
    case ".mkv":
      valid = startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
      break;
    case ".avif":
      valid = isIsoBaseMedia(bytes) && /avif|avis/.test(ascii(8, Math.min(bytes.length, 64)));
      break;
    case ".svg":
      throw new Error("freeze failed: remote SVG is not accepted; download and review it locally");
    case ".cube": {
      try {
        valid = validateCube(new TextDecoder("utf-8", { fatal: true }).decode(bytes)).ok;
      } catch {
        valid = false;
      }
      break;
    }
    default:
      throw new Error(`freeze failed: unsupported destination media extension ${ext || "(none)"}`);
  }
  if (!valid) throw new Error(`freeze failed: downloaded bytes do not match ${ext} media`);
}

export async function freezeUrl(url, destPath) {
  const where = String(url).slice(0, 80);
  const res = await fetchMedia(url);
  if (!res.ok) throw new Error(`freeze failed: HTTP ${res.status} for ${where}`);

  // Fail fast on an advertised oversize body before reading a single byte.
  const declared = Number(res.headers.get("content-length"));
  if (declared > MAX_FREEZE_BYTES)
    throw new Error(
      `freeze failed: ${declared} bytes exceeds ${MAX_FREEZE_BYTES} cap for ${where}`,
    );

  // Stream and abort once the cap is crossed, so a lying/chunked hostile URL
  // can't buffer the whole payload into memory before the check (M1).
  const chunks = [];
  let total = 0;
  for await (const chunk of res.body) {
    total += chunk.length;
    if (total > MAX_FREEZE_BYTES)
      throw new Error(`freeze failed: stream exceeds ${MAX_FREEZE_BYTES} cap for ${where}`);
    chunks.push(chunk);
  }
  if (total === 0) throw new Error(`freeze failed: empty response for ${where}`);

  const bytes = Buffer.concat(chunks, total);
  assertRemoteMediaBytes(bytes, destPath);
  const published = spawnSync(process.execPath, [PUBLISHER, destPath], {
    input: bytes,
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
    timeout: 60_000,
    windowsHide: true,
  });
  if (published.status !== 0) {
    const detail = published.error?.message || published.stderr?.trim() || "publisher failed";
    throw new Error(`freeze failed: ${detail}`);
  }
  return total;
}

export function freezeLocalFile(srcPath, destPath) {
  mkdirSync(dirname(destPath), { recursive: true });
  copyFileSync(srcPath, destPath);
}

// Ingest accepts a DIRECT public media URL only — not a platform page. yt-dlp is
// deliberately out (cloud IPs get blocked, and it's brittle); the supported case
// is "user points at their own file or a direct asset link". A direct URL is a
// non-platform host whose path ends in a known media extension.
const PLATFORM_HOSTS =
  /(^|\.)(youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|instagram\.com|twitter\.com|x\.com|facebook\.com|dailymotion\.com)$/i;
const MEDIA_EXT = /\.(mp3|wav|m4a|aac|ogg|flac|mp4|m4v|mov|webm|mkv|png|jpe?g|webp|gif|avif)$/i;

export function isDirectMediaUrl(u) {
  let url;
  try {
    url = new URL(u);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (PLATFORM_HOSTS.test(url.hostname)) return false;
  if (!isPublicMediaUrl(url)) return false;
  return MEDIA_EXT.test(url.pathname);
}
