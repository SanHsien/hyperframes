import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
import { join } from "node:path";
import { test } from "node:test";
import { publishHostedBytes } from "./catalog-hosted-publisher.mjs";

function fixture() {
  return mkdtempSync(join(tmpdir(), "hf-hosted-publisher-"));
}

function prefix(bytes) {
  return createHash("sha256").update(bytes).digest("hex").slice(0, 16);
}

test("replaces an existing regular file", () => {
  const root = fixture();
  const destination = join(root, "asset.bin");
  const bytes = Buffer.from("replacement");
  writeFileSync(destination, "previous");
  try {
    publishHostedBytes(bytes, destination, prefix(bytes));
    assert.equal(readFileSync(destination, "utf8"), "replacement");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("refuses to replace a directory", () => {
  const root = fixture();
  const destination = join(root, "assets");
  const bytes = Buffer.from("replacement");
  mkdirSync(destination);
  writeFileSync(join(destination, "keep.txt"), "keep");
  try {
    assert.throws(
      () => publishHostedBytes(bytes, destination, prefix(bytes)),
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
  const bytes = Buffer.from("replacement");
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
      () => publishHostedBytes(bytes, destination, prefix(bytes), { rename }),
      /backup preserved at/,
    );
    const recoveryDir = readdirSync(root).find((name) => name.startsWith(".hf-hosted-"));
    assert.ok(recoveryDir);
    const backup = join(root, recoveryDir, "previous");
    assert.equal(existsSync(backup), true);
    assert.equal(readFileSync(backup, "utf8"), "previous");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
