import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { publishFreezeBytes } from "./freeze-publisher.mjs";

function fixture() {
  return mkdtempSync(join(tmpdir(), "hf-freeze-publisher-"));
}

test("replaces an existing regular file atomically", () => {
  const root = fixture();
  const destination = join(root, "asset.bin");
  writeFileSync(destination, "previous");
  try {
    publishFreezeBytes(Buffer.from("replacement"), destination);
    assert.equal(readFileSync(destination, "utf8"), "replacement");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("refuses to replace a directory", () => {
  const root = fixture();
  const destination = join(root, "assets");
  mkdirSync(destination);
  writeFileSync(join(destination, "keep.txt"), "keep");
  try {
    assert.throws(
      () => publishFreezeBytes(Buffer.from("replacement"), destination),
      /must be a regular file/,
    );
    assert.equal(readFileSync(join(destination, "keep.txt"), "utf8"), "keep");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("preserves a recoverable backup when publish and rollback both fail", () => {
  const root = fixture();
  const destination = join(root, "asset.bin");
  writeFileSync(destination, "previous");
  let calls = 0;
  const rename = (from, to) => {
    calls++;
    if (calls === 1) return renameSync(from, to);
    const error = new Error("injected rename failure");
    error.code = "EACCES";
    throw error;
  };
  try {
    assert.throws(
      () => publishFreezeBytes(Buffer.from("replacement"), destination, { rename }),
      /backup preserved at/,
    );
    const recoveryDir = readdirSync(root).find((name) => name.startsWith(".hf-freeze-"));
    assert.ok(recoveryDir);
    const backup = join(root, recoveryDir, "previous");
    assert.equal(existsSync(backup), true);
    assert.equal(readFileSync(backup, "utf8"), "previous");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("restores and preserves a destination raced to a directory", () => {
  const root = fixture();
  const destination = join(root, "asset.bin");
  writeFileSync(destination, "previous");
  let calls = 0;
  const rename = (from, to) => {
    calls++;
    if (calls === 1) {
      rmSync(destination);
      mkdirSync(destination);
      writeFileSync(join(destination, "keep.txt"), "keep");
    }
    return renameSync(from, to);
  };
  try {
    assert.throws(
      () => publishFreezeBytes(Buffer.from("replacement"), destination, { rename }),
      /destination changed/,
    );
    assert.equal(readFileSync(join(destination, "keep.txt"), "utf8"), "keep");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("never recursively deletes a backup raced to a directory after validation", () => {
  const root = fixture();
  const destination = join(root, "asset.bin");
  writeFileSync(destination, "previous");
  let calls = 0;
  const rename = (from, to) => {
    calls++;
    if (calls === 2) {
      const backup = join(dirname(from), "previous");
      rmSync(backup);
      mkdirSync(backup);
      writeFileSync(join(backup, "keep.txt"), "keep");
    }
    return renameSync(from, to);
  };
  try {
    assert.throws(
      () => publishFreezeBytes(Buffer.from("replacement"), destination, { rename }),
      /recovery preserved at/,
    );
    const recoveryDir = readdirSync(root).find((name) => name.startsWith(".hf-freeze-"));
    assert.ok(recoveryDir);
    assert.equal(readFileSync(join(root, recoveryDir, "previous", "keep.txt"), "utf8"), "keep");
    assert.equal(readFileSync(destination, "utf8"), "replacement");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
