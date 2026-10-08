import { fetchMedia, isPublicMediaUrl, readCappedBody } from "./media-fetch.mjs";
import { sanitizeSvg } from "./svg-sanitize.mjs";
import { writeFileSync, copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, extname } from "node:path";
import { validateCube } from "./cube-validate.mjs";

// ponytail: bound the download so a hostile/runaway URL can't fill the disk.
// 256MB covers any real media asset; raise if 4K video sources ever exceed it.
const MAX_FREEZE_BYTES = 256 * 1024 * 1024;
// Bounds only the wait for response headers; a large video body may stream for minutes.
const FREEZE_HEADERS_TIMEOUT_MS = 10_000;

const isSvgPath = (destPath) => /\.svg$/i.test(destPath);

function startsWith(bytes, signature) {
  return signature.every((value, index) => bytes[index] === value);
}

function isIsoBaseMedia(bytes) {
  return bytes.length >= 12 && bytes.subarray(4, 8).toString("ascii") === "ftyp";
}

/**
 * Verify that downloaded bytes match the media type selected by the destination extension.
 *
 * A host that answers with an HTML error page, an HLS playlist or a script under a media URL would
 * otherwise be frozen into the project with a media extension. SVG is not decided here: it passes
 * through to sanitizeSvg in writeFrozen. Unknown extensions fail closed.
 */
export function assertRemoteMediaBytes(bytes, destPath) {
  const ext = extname(destPath).toLowerCase();
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
      // Sanitized by writeFrozen, not signature-checked.
      return;
    case ".cube":
      try {
        valid = validateCube(new TextDecoder("utf-8", { fatal: true }).decode(bytes)).ok;
      } catch {
        valid = false;
      }
      break;
    default:
      throw new Error(`freeze failed: unsupported destination media extension ${ext || "(none)"}`);
  }
  if (!valid) throw new Error(`freeze failed: downloaded bytes do not match ${ext} media`);
}

// Every logo/icon SVG comes from a third-party host (theSVG, a --from URL, a local file), so it
// passes the Figma import's sanitizeSvg allowlist before it touches disk.
function writeFrozen(destPath, buffer) {
  mkdirSync(dirname(destPath), { recursive: true });
  const bytes = isSvgPath(destPath) ? Buffer.from(sanitizeSvg(buffer.toString("utf8"))) : buffer;
  writeFileSync(destPath, bytes);
  return bytes.byteLength;
}

export async function freezeUrl(url, destPath) {
  const where = String(url).slice(0, 80);
  const headerWait = new AbortController();
  const timer = setTimeout(
    () =>
      headerWait.abort(
        new Error(`freeze failed: no response within ${FREEZE_HEADERS_TIMEOUT_MS} ms for ${where}`),
      ),
    FREEZE_HEADERS_TIMEOUT_MS,
  );
  const res = await fetchMedia(url, { signal: headerWait.signal }).finally(() =>
    clearTimeout(timer),
  );
  if (!res.ok) throw new Error(`freeze failed: HTTP ${res.status} for ${where}`);

  const body = await readCappedBody(res, MAX_FREEZE_BYTES, `freeze failed for ${where}`);
  if (body.byteLength === 0) throw new Error(`freeze failed: empty response for ${where}`);

  assertRemoteMediaBytes(body, destPath);
  return writeFrozen(destPath, body);
}

export function freezeLocalFile(srcPath, destPath) {
  if (isSvgPath(destPath)) {
    writeFrozen(destPath, readFileSync(srcPath));
    return;
  }
  mkdirSync(dirname(destPath), { recursive: true });
  copyFileSync(srcPath, destPath);
}

// Ingest accepts a DIRECT public media URL only — not a platform page. yt-dlp is
// deliberately out (cloud IPs get blocked, and it's brittle); the supported case
// is "user points at their own file or a direct asset link". A direct URL is a
// non-platform host whose path ends in a known media extension.
const PLATFORM_HOSTS =
  /(^|\.)(youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|instagram\.com|twitter\.com|x\.com|facebook\.com|dailymotion\.com)$/i;
const MEDIA_EXT = /\.(mp3|wav|m4a|aac|ogg|flac|mp4|mov|webm|mkv|png|jpe?g|webp|gif|svg|avif)$/i;

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
