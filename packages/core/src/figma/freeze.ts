/**
 * "Freeze" = write asset bytes to local disk permanently so renders never
 * re-fetch from figma (design spec §5) — not Object.freeze.
 */

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// ponytail: bound the write so a hostile/runaway source can't fill the disk.
export const MAX_FREEZE_BYTES = 256 * 1024 * 1024;

export function exceedsFreezeCap(byteLength: number): boolean {
  return byteLength > MAX_FREEZE_BYTES;
}

export function freezeBytes(bytes: Uint8Array, destPath: string): number {
  if (bytes.length === 0) throw new Error("freeze failed: empty bytes");
  if (exceedsFreezeCap(bytes.length))
    throw new Error(`freeze failed: ${bytes.length} bytes exceeds ${MAX_FREEZE_BYTES} cap`);
  mkdirSync(dirname(destPath), { recursive: true });
  // Exclusive create; on EEXIST remove and retry — never write through an
  // existing file or planted symlink (CodeQL js/insecure-temporary-file).
  try {
    writeFileSync(destPath, bytes, { flag: "wx", mode: 0o600 });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
    rmSync(destPath);
    writeFileSync(destPath, bytes, { flag: "wx", mode: 0o600 });
  }
  return bytes.length;
}

/**
 * Only figma-owned hosts may be frozen from a URL — render/CDN responses
 * come from figma.com subdomains or figma's S3 buckets. Blocks SSRF via a
 * crafted manifest/config URL (metadata endpoints, internal services).
 */
export function isAllowedFreezeUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname;
  return (
    host === "figma.com" ||
    host.endsWith(".figma.com") ||
    /^figma-alpha-api\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/.test(host)
  );
}

const FIGMA_ASSET_PUBLISHER = String.raw`
const { mkdtempSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } = require("node:fs");
const { basename, dirname, extname, join } = require("node:path");

const destination = process.argv[1];
const contentType = (process.argv[2] || "").split(";", 1)[0].trim().toLowerCase();
const bytes = readFileSync(0);
const ext = extname(destination).toLowerCase();

function fail(message) {
  process.stderr.write(message);
  process.exit(1);
}

const signatures = {
  ".png": () => bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  ".jpg": () => bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9,
  ".jpeg": () => bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9,
  ".pdf": () => bytes.subarray(0, 5).toString("ascii") === "%PDF-" && bytes.subarray(-1024).includes(Buffer.from("%%EOF")),
  ".svg": () => {
    const text = bytes.toString("utf8").replace(/^\uFEFF/, "").trimStart();
    const lower = text.toLowerCase();
    if (!(text.startsWith("<svg") || (text.startsWith("<?xml") && lower.includes("<svg")))) return false;
    if (["<!doctype", "<script", "<foreignobject", "<style", "<iframe", "<object", "<embed", "<set", "<animate"].some((value) => lower.includes(value))) return false;
    if (/\son[a-z]+\s*=|\ssrcdoc\s*=/.test(lower)) return false;
    if (text.includes("\\")) return false;
    if (/url\(\s*["']?(?!#)/i.test(text)) return false;
    for (const match of text.matchAll(/\b(?:href|xlink:href|src)\s*=\s*(["'])(.*?)\1/gi)) {
      const value = match[2].trim();
      if (!value.startsWith("#") && !/^data:image\/(?:png|jpeg|gif|webp);base64,/i.test(value)) return false;
    }
    return true;
  },
};
const expectedTypes = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};
if (!signatures[ext] || !signatures[ext]()) fail("asset bytes do not match the destination format");
if (contentType && contentType !== "application/octet-stream" && contentType !== expectedTypes[ext]) {
  fail("response content-type does not match the destination format");
}

mkdirSync(dirname(destination), { recursive: true });
const tempDir = mkdtempSync(join(dirname(destination), ".hf-figma-"));
const staged = join(tempDir, basename(destination));
const backup = join(tempDir, "previous");
let movedPrevious = false;
try {
  writeFileSync(staged, bytes, { flag: "wx", mode: 0o600 });
  try {
    renameSync(destination, backup);
    movedPrevious = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    renameSync(staged, destination);
  } catch (error) {
    if (movedPrevious) renameSync(backup, destination);
    throw error;
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
`;

async function fetchAllowedFreezeUrl(url: string): Promise<Response> {
  let current = new URL(url);
  for (let hop = 0; hop <= 5; hop++) {
    if (!isAllowedFreezeUrl(current.href)) {
      throw new Error(`freeze failed: refusing non-figma url ${current.href}`);
    }
    const response = await fetch(current.href, { redirect: "manual" });
    if (response.status < 300 || response.status >= 400) return response;
    await response.body?.cancel();
    const location = response.headers.get("location");
    if (!location) throw new Error("freeze failed: redirect has no Location");
    current = new URL(location, current);
  }
  throw new Error("freeze failed: redirect limit exceeded");
}

export async function freezeUrl(url: string, destPath: string): Promise<number> {
  if (!isAllowedFreezeUrl(url))
    throw new Error(`freeze failed: refusing non-figma url ${url} (https + figma hosts only)`);
  const res = await fetchAllowedFreezeUrl(url);
  if (!res.ok) throw new Error(`freeze failed: HTTP ${res.status}`);
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (exceedsFreezeCap(declared))
    throw new Error(`freeze failed: content-length ${declared} exceeds ${MAX_FREEZE_BYTES} cap`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length === 0) throw new Error("freeze failed: empty bytes");
  if (exceedsFreezeCap(bytes.length))
    throw new Error(`freeze failed: ${bytes.length} bytes exceeds ${MAX_FREEZE_BYTES} cap`);
  const publish = spawnSync(
    process.execPath,
    ["-e", FIGMA_ASSET_PUBLISHER, destPath, res.headers.get("content-type") ?? ""],
    {
      input: bytes,
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
      timeout: 30_000,
      windowsHide: true,
    },
  );
  if (publish.status !== 0) {
    const detail = publish.error?.message || publish.stderr.trim() || "asset validation failed";
    throw new Error(`freeze failed: ${detail}`);
  }
  return bytes.length;
}

export function freezeLocalFile(srcPath: string, destPath: string): void {
  const size = statSync(srcPath).size;
  if (exceedsFreezeCap(size))
    throw new Error(`freeze failed: ${size} bytes exceeds ${MAX_FREEZE_BYTES} cap`);
  mkdirSync(dirname(destPath), { recursive: true });
  copyFileSync(srcPath, destPath);
}
