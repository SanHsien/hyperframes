import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { publishInlineHtml } from "./inline-project-publisher.mjs";

function project() {
  return mkdtempSync(join(tmpdir(), "hf-inline-project-test-"));
}

test("publishes bytes to the fixed index.html destination", () => {
  const dir = project();
  try {
    publishInlineHtml(Buffer.from("<html><body>ok</body></html>"), dir);
    assert.equal(readFileSync(join(dir, "index.html"), "utf8"), "<html><body>ok</body></html>");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("rejects a symlink destination instead of replacing its target", () => {
  const dir = project();
  const target = join(dir, "outside.html");
  const destination = join(dir, "index.html");
  try {
    writeFileSync(target, "keep");
    // Windows CI can lack symlink privileges; this security regression is
    // exercised on platforms where the filesystem permits creating one.
    try {
      symlinkSync(target, destination);
    } catch (error) {
      if (process.platform === "win32") return;
      throw error;
    }
    assert.throws(() => publishInlineHtml(Buffer.from("replace"), dir), /regular file/);
    assert.equal(readFileSync(target, "utf8"), "keep");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("restores an existing file when atomic publication fails", () => {
  const dir = project();
  const destination = join(dir, "index.html");
  try {
    writeFileSync(destination, "keep");
    let calls = 0;
    const rename = (from, to) => {
      calls += 1;
      if (calls === 2) throw new Error("injected publication failure");
      renameSync(from, to);
    };
    assert.throws(
      () => publishInlineHtml(Buffer.from("replace"), dir, { rename }),
      /injected publication failure/,
    );
    assert.equal(readFileSync(destination, "utf8"), "keep");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("never recursively deletes a backup raced to a directory", () => {
  const dir = project();
  const destination = join(dir, "index.html");
  writeFileSync(destination, "previous");
  let calls = 0;
  const rename = (from, to) => {
    calls += 1;
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
      () => publishInlineHtml(Buffer.from("replacement"), dir, { rename }),
      /recovery preserved at/,
    );
    const recoveryDir = readdirSync(dir).find((name) => name.startsWith(".hf-inline-publish-"));
    assert.ok(recoveryDir);
    assert.equal(readFileSync(join(dir, recoveryDir, "previous", "keep.txt"), "utf8"), "keep");
    assert.equal(readFileSync(destination, "utf8"), "replacement");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
