import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

export function publishHostedBytes(
  bytes,
  destination,
  expectedPrefix,
  { rename = renameSync } = {},
) {
  if (!/^[0-9a-f]{16}$/.test(expectedPrefix)) {
    throw new Error("invalid hosted asset digest prefix");
  }
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (!actual.startsWith(expectedPrefix)) {
    throw new Error("hosted asset digest does not match its content-addressed URL");
  }

  mkdirSync(dirname(destination), { recursive: true });
  if (existsSync(destination)) {
    const existing = lstatSync(destination);
    if (!existing.isFile() || existing.isSymbolicLink()) {
      throw new Error("hosted asset destination must be a regular file");
    }
  }
  const tempDir = mkdtempSync(join(dirname(destination), ".hf-hosted-"));
  const staged = join(tempDir, basename(destination));
  const backup = join(tempDir, "previous");
  let movedPrevious = false;
  let preserveRecovery = false;
  try {
    writeFileSync(staged, bytes, { flag: "wx", mode: 0o600 });
    try {
      rename(destination, backup);
      movedPrevious = true;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
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
            `hosted asset publish and rollback failed; backup preserved at ${backup}`,
            {
              cause: new AggregateError([publishError, rollbackError]),
            },
          );
        }
      }
      throw publishError;
    }
  } finally {
    if (!preserveRecovery) rmSync(tempDir, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  publishHostedBytes(readFileSync(0), process.argv[2], process.argv[3]);
}
