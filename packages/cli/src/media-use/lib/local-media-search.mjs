import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { rankMediaRowsWithVectors } from "./media-search.mjs";

const DEFAULT_DIRECTORY = join(homedir(), ".hyperframes", "catalog");
const ARTIFACT_FILES = ["media-vectors.json", "media-vectors.bin"];
// Mirrors LOCAL_MODEL_DIMENSIONS in registry/localModel.ts; media-use cannot import the TypeScript source.
const MODEL_DIMENSIONS = 384;

function directory() {
  return process.env.HYPERFRAMES_CATALOG_ARTIFACT_DIR || DEFAULT_DIRECTORY;
}

/**
 * Where the release ships the vector pair: `dist/catalog-artifact` in the published layout
 * (`dist/skills/media-use/scripts/lib`), `registry/catalog-artifact` in a source checkout.
 */
function bundledDirectory() {
  const candidates = [
    join(import.meta.dirname, "..", "..", "..", "..", "catalog-artifact"),
    join(import.meta.dirname, "..", "..", "..", "..", "..", "registry", "catalog-artifact"),
  ];
  return candidates.find((candidate) => existsSync(join(candidate, ARTIFACT_FILES[0])));
}

function isMediaVectorRow(row) {
  return (
    !!row &&
    typeof row === "object" &&
    typeof row.id === "string" &&
    typeof row.kind === "string" &&
    typeof row.title === "string" &&
    typeof row.description === "string" &&
    Array.isArray(row.tags) &&
    row.tags.every((tag) => typeof tag === "string") &&
    typeof row.file === "string" &&
    (row.duration === undefined ||
      (typeof row.duration === "number" && Number.isFinite(row.duration) && row.duration >= 0)) &&
    (row.dimensions === undefined ||
      (typeof row.dimensions === "object" &&
        row.dimensions !== null &&
        Number.isInteger(row.dimensions.width) &&
        Number.isInteger(row.dimensions.height) &&
        row.dimensions.width > 0 &&
        row.dimensions.height > 0))
  );
}

/** A catalog `file` is a relative path with no drive, no root and no `..` segment. */
function isPlainRelativeFile(file) {
  if (typeof file !== "string" || file === "" || file.includes("\0")) return false;
  if (isAbsolute(file) || /^[A-Za-z]:/.test(file) || /^[\\/]/.test(file)) return false;
  return !file.split(/[\\/]+/).includes("..");
}

/**
 * Does a metadata/matrix pair describe one index? Same contract as `vectorPairAgrees` in
 * registry/localSemantic.ts for `media-vectors`, plus a check that every row's `file` is a plain
 * relative path so a tampered pair is refused before it is cached.
 */
function mediaVectorPairAgrees(meta, bin) {
  try {
    const parsed = JSON.parse(meta.toString("utf-8"));
    if (parsed.dimensions !== MODEL_DIMENSIONS) return false;
    if (
      !Array.isArray(parsed.rows) ||
      !Array.isArray(parsed.names) ||
      parsed.rows.length !== parsed.names.length ||
      parsed.rows.some(
        (row, index) =>
          !isMediaVectorRow(row) ||
          row.id !== parsed.names[index] ||
          !isPlainRelativeFile(row.file),
      )
    ) {
      return false;
    }
    return bin.byteLength === parsed.names.length * MODEL_DIMENSIONS * 4;
  } catch {
    return false;
  }
}

/**
 * Put the release-bundled media vectors in the user's cache. Never fetches: the pair comes from
 * the installed package and is validated before either file lands (temp file, then rename, mode
 * 0o600). Returns false rather than throwing; a missing or invalid pair only disables the tier.
 */
export function installMediaVectors(options = {}) {
  const target = options.directory || directory();
  const source = options.sourceDirectory || bundledDirectory();
  if (!source) return false;
  const staged = [];
  try {
    const [meta, bin] = ARTIFACT_FILES.map((file) => readFileSync(join(source, file)));
    if (!mediaVectorPairAgrees(meta, bin)) return false;
    mkdirSync(target, { recursive: true, mode: 0o700 });
    for (const [file, bytes] of [
      [ARTIFACT_FILES[0], meta],
      [ARTIFACT_FILES[1], bin],
    ]) {
      const temporary = join(target, `.${file}.${process.pid}.tmp`);
      staged.push(temporary);
      writeFileSync(temporary, bytes, { mode: 0o600 });
    }
    for (const [index, file] of ARTIFACT_FILES.entries()) {
      renameSync(staged[index], join(target, file));
    }
    return true;
  } catch {
    for (const temporary of staged) rmSync(temporary, { force: true });
    return false;
  }
}

export function mediaVectorRows(target = directory()) {
  const metadataPath = join(target, "media-vectors.json");
  if (!existsSync(metadataPath)) return [];
  const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
  return Array.isArray(metadata.rows) ? metadata.rows : [];
}

/**
 * Resolve a catalog row's `file` to an existing file inside `root`, or null. Absolute paths,
 * drive-relative paths and any `..` segment are refused, so a tampered row cannot point the
 * freeze step at a file outside the bundled SFX tree.
 */
export function resolveBundledMediaFile(file, root) {
  if (!isPlainRelativeFile(file)) return null;
  const base = resolve(root);
  const candidate = resolve(base, file);
  const inside = relative(base, candidate);
  if (inside === "" || inside.startsWith("..") || isAbsolute(inside)) return null;
  return existsSync(candidate) ? candidate : null;
}

/**
 * Rank the bundled SFX rows for an intent and resolve the best row to a file inside `root`.
 * Everything comes from the installed package; there is no network path. Returns null when the
 * vectors are unavailable, nothing matches, or the matched row's file is missing or escapes `root`.
 */
export async function searchLocalSfxIndex(intent, root, options = {}) {
  if (!installMediaVectors(options)) return null;
  const ranked = await rankMediaRowsWithVectors(
    intent,
    mediaVectorRows(options.directory || directory()).filter((row) => row.kind === "sfx"),
  );
  const row = ranked.rows[0];
  const localPath = row ? resolveBundledMediaFile(row.file, root) : null;
  return row && localPath ? { row, localPath, tier: ranked.tier } : null;
}

export { rankMediaRowsWithVectors };
