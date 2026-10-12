import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
  openSync,
  closeSync,
  readSync,
  writeSync,
  fstatSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

function entryAt(path) {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

// Reject existing links/junctions along the parent path; Node's pathname APIs do not
// pin ancestors against a hostile process replacing directories during an operation.
function assertParents(parent) {
  let current = parent;
  while (true) {
    const entry = entryAt(current);
    if (entry && (!entry.isDirectory() || entry.isSymbolicLink())) {
      throw new Error("freeze publisher parent must be a real directory");
    }
    const next = dirname(current);
    if (next === current) return;
    current = next;
  }
}

export function publishFreezeBytes(
  bytes,
  destination,
  { rename = renameSync, stageWrite = writeFileSync } = {},
) {
  if (bytes.length === 0) throw new Error("freeze publisher refuses an empty asset");
  return publishStaged(
    destination,
    (staged) => {
      stageWrite(staged, bytes, { flag: "wx", mode: 0o600 });
      if (!readFileSync(staged).equals(Buffer.from(bytes))) {
        throw new Error("freeze publisher staging write was incomplete");
      }
    },
    rename,
  );
}

// Local files have no download-size limit. Copy and verify using bounded buffers;
// an empty non-SVG local file keeps the existing copyFileSync contract.
export function publishFreezeFile(
  source,
  destination,
  { rename = renameSync, read = readSync, write = writeSync, chunkSize = 64 * 1024 } = {},
) {
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 1024 * 1024) {
    throw new Error("freeze publisher chunk size must be between 1 and 1048576");
  }
  return publishStaged(
    destination,
    (staged) => {
      const sourceFd = openSync(source, "r");
      let stagedFd;
      try {
        const original = fstatSync(sourceFd);
        if (!original.isFile()) throw new Error("freeze publisher source must be a regular file");
        stagedFd = openSync(staged, "wx+", 0o600);
        const buffer = Buffer.allocUnsafe(chunkSize);
        const sourceHash = createHash("sha256");
        let position = 0;
        while (position < original.size) {
          const length = read(
            sourceFd,
            buffer,
            0,
            Math.min(buffer.length, original.size - position),
            position,
          );
          if (length <= 0 || length > Math.min(buffer.length, original.size - position)) {
            throw new Error("freeze publisher source read was incomplete");
          }
          sourceHash.update(buffer.subarray(0, length));
          let written = 0;
          while (written < length) {
            const count = write(stagedFd, buffer, written, length - written, position + written);
            if (count <= 0 || count > length - written)
              throw new Error("freeze publisher staging write was incomplete");
            written += count;
          }
          position += length;
        }
        const current = fstatSync(sourceFd);
        if (
          current.size !== original.size ||
          current.mtimeMs !== original.mtimeMs ||
          current.ctimeMs !== original.ctimeMs
        ) {
          throw new Error("freeze publisher source changed during copy");
        }
        if (fstatSync(stagedFd).size !== original.size)
          throw new Error("freeze publisher staging write was incomplete");
        const stagedHash = createHash("sha256");
        position = 0;
        while (position < original.size) {
          const length = read(
            stagedFd,
            buffer,
            0,
            Math.min(buffer.length, original.size - position),
            position,
          );
          if (length <= 0 || length > Math.min(buffer.length, original.size - position)) {
            throw new Error("freeze publisher staging read was incomplete");
          }
          stagedHash.update(buffer.subarray(0, length));
          position += length;
        }
        if (sourceHash.digest("hex") !== stagedHash.digest("hex")) {
          throw new Error("freeze publisher staging bytes did not match source");
        }
      } finally {
        try {
          if (stagedFd !== undefined) closeSync(stagedFd);
        } finally {
          closeSync(sourceFd);
        }
      }
    },
    rename,
  );
}

function publishStaged(destination, stage, rename) {
  destination = resolve(destination);
  const parent = dirname(destination);
  assertParents(parent);
  mkdirSync(parent, { recursive: true });
  assertParents(parent);
  const existing = entryAt(destination);
  if (existing) {
    if (!existing.isFile() || existing.isSymbolicLink()) {
      throw new Error("freeze publisher destination must be a regular file");
    }
  }

  const lock = join(
    parent,
    `.hf-freeze-lock-${createHash("sha256").update(basename(destination).toLowerCase()).digest("hex")}`,
  );
  mkdirSync(lock); // A competing/cooperative publisher fails closed rather than overwriting recovery.
  let tempDir;
  try {
    tempDir = mkdtempSync(join(parent, ".hf-freeze-"));
  } catch (error) {
    rmdirSync(lock);
    throw error;
  }
  const staged = join(tempDir, "staged");
  const backup = join(tempDir, "previous");
  let movedPrevious = false;
  let preserveRecovery = false;
  let operationError;
  try {
    stage(staged);
    assertParents(parent);
    try {
      rename(destination, backup);
      movedPrevious = true;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (movedPrevious) {
      const moved = lstatSync(backup);
      if (!moved.isFile() || moved.isSymbolicLink()) {
        try {
          assertParents(parent);
          rename(backup, destination);
          movedPrevious = false;
        } catch (rollbackError) {
          preserveRecovery = true;
          throw new Error(
            `freeze publisher rejected a raced destination; recovery preserved at ${backup}`,
            {
              cause: rollbackError,
            },
          );
        }
        throw new Error("freeze publisher destination changed from a regular file");
      }
    }
    try {
      assertParents(parent);
      rename(staged, destination);
    } catch (publishError) {
      if (movedPrevious) {
        try {
          assertParents(parent);
          rename(backup, destination);
          movedPrevious = false;
        } catch (rollbackError) {
          preserveRecovery = true;
          throw new Error(`freeze publisher and rollback failed; backup preserved at ${backup}`, {
            cause: new AggregateError([publishError, rollbackError]),
          });
        }
      }
      throw publishError;
    }
  } catch (error) {
    operationError = error;
  }

  let cleanupError;
  if (!preserveRecovery) {
    try {
      assertParents(parent);
      for (const candidate of [staged, backup]) {
        const entry = entryAt(candidate);
        if (!entry) continue;
        if (!entry.isFile() || entry.isSymbolicLink()) {
          throw new Error(`refusing to clean unexpected recovery object at ${candidate}`);
        }
        unlinkSync(candidate);
      }
      rmdirSync(tempDir);
    } catch (error) {
      cleanupError = error;
    }
  }
  try {
    assertParents(parent);
    rmdirSync(lock);
  } catch (error) {
    cleanupError ??= error;
  }
  if (cleanupError) {
    throw new Error(`freeze publisher cleanup failed; recovery preserved at ${tempDir}`, {
      cause: cleanupError,
    });
  }
  if (operationError) throw operationError;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  publishFreezeBytes(readFileSync(0), process.argv[2]);
}
