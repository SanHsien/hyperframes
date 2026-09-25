import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

export function publishFreezeBytes(bytes, destination, { rename = renameSync } = {}) {
  if (bytes.length === 0) throw new Error("freeze publisher refuses an empty asset");

  mkdirSync(dirname(destination), { recursive: true });
  if (existsSync(destination)) {
    const existing = lstatSync(destination);
    if (!existing.isFile() || existing.isSymbolicLink()) {
      throw new Error("freeze publisher destination must be a regular file");
    }
  }

  const tempDir = mkdtempSync(join(dirname(destination), ".hf-freeze-"));
  const staged = join(tempDir, basename(destination));
  const backup = join(tempDir, "previous");
  let movedPrevious = false;
  let preserveRecovery = false;
  let operationError;
  try {
    writeFileSync(staged, bytes, { flag: "wx", mode: 0o600 });
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
      rename(staged, destination);
    } catch (publishError) {
      if (movedPrevious) {
        try {
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
      for (const candidate of [staged, backup]) {
        if (!existsSync(candidate)) continue;
        const entry = lstatSync(candidate);
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
