import {
  existsSync,
  lstatSync,
  mkdtempSync,
  openSync,
  closeSync,
  fsyncSync,
  readFileSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";

export const MAX_INLINE_HTML_BYTES = 8 * 1024 * 1024;

function assertRegularFile(path) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error("inline project publisher destination must be a regular file");
  }
}

function writePrivateFile(path, bytes) {
  const fd = openSync(path, "wx", 0o600);
  try {
    let offset = 0;
    while (offset < bytes.length) offset += writeSync(fd, bytes, offset);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

/**
 * Publish one validated HTML payload into a directory created with mkdtemp.
 * The destination is deliberately derived from the trusted project directory;
 * callers cannot provide an arbitrary filename or path.
 */
export function publishInlineHtml(bytes, projectDir, { rename = renameSync } = {}) {
  if (!Buffer.isBuffer(bytes)) throw new TypeError("inline HTML must be a Buffer");
  if (bytes.length === 0 || bytes.length > MAX_INLINE_HTML_BYTES) {
    throw new Error("inline HTML payload is outside the allowed size range");
  }
  const projectStat = lstatSync(projectDir);
  if (!projectStat.isDirectory() || projectStat.isSymbolicLink()) {
    throw new Error("inline project publisher requires a regular private directory");
  }

  const destination = join(projectDir, "index.html");
  if (existsSync(destination)) assertRegularFile(destination);

  const stagingDir = mkdtempSync(join(projectDir, ".hf-inline-publish-"));
  const staged = join(stagingDir, basename(destination));
  const backup = join(stagingDir, "previous");
  let movedPrevious = false;
  let preserveRecovery = false;
  let operationError;
  try {
    writePrivateFile(staged, bytes);
    try {
      rename(destination, backup);
      movedPrevious = true;
      try {
        assertRegularFile(backup);
      } catch (validationError) {
        try {
          rename(backup, destination);
          movedPrevious = false;
        } catch (rollbackError) {
          preserveRecovery = true;
          throw new Error(
            `inline HTML destination validation failed; backup preserved at ${backup}`,
            {
              cause: rollbackError,
            },
          );
        }
        throw validationError;
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
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
          throw new Error(
            `inline HTML publish and rollback failed; backup preserved at ${backup}`,
            {
              cause: new AggregateError([publishError, rollbackError]),
            },
          );
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
      rmdirSync(stagingDir);
    } catch (error) {
      cleanupError = error;
    }
  }
  if (cleanupError) {
    throw new Error(`inline HTML publisher cleanup failed; recovery preserved at ${stagingDir}`, {
      cause: cleanupError,
    });
  }
  if (operationError) throw operationError;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  publishInlineHtml(readFileSync(0), process.argv[2]);
}
