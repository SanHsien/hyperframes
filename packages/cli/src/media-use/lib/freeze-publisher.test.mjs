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
  symlinkSync,
  statSync,
  readSync,
  writeSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { publishFreezeBytes } from "./freeze-publisher.mjs";
import * as publisher from "./freeze-publisher.mjs";

function fixture() {
  return mkdtempSync(join(tmpdir(), "hf-freeze-publisher-"));
}

test("replaces an existing regular file without writing through it", () => {
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

test("refuses a linked parent directory, including a Windows junction", () => {
  const root = fixture();
  const target = join(root, "outside");
  const parent = join(root, "linked");
  mkdirSync(target);
  symlinkSync(target, parent, process.platform === "win32" ? "junction" : "dir");
  try {
    assert.throws(
      () => publishFreezeBytes(Buffer.from("new"), join(parent, "asset.bin")),
      /parent must be a real directory/,
    );
    assert.deepEqual(readdirSync(target), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("detects an incomplete staging write, preserving the old asset and cleaning staging", () => {
  const root = fixture();
  const destination = join(root, "asset.bin");
  writeFileSync(destination, "old");
  try {
    assert.throws(
      () =>
        publishFreezeBytes(Buffer.from("new bytes"), destination, {
          stageWrite(path, bytes, options) {
            writeFileSync(path, bytes.subarray(0, 2), options);
          },
        }),
      /staging write was incomplete/,
    );
    assert.equal(readFileSync(destination, "utf8"), "old");
    assert.deepEqual(readdirSync(root), ["asset.bin"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("cleans a partial staging write that throws", () => {
  const root = fixture();
  const destination = join(root, "asset.bin");
  try {
    assert.throws(
      () =>
        publishFreezeBytes(Buffer.from("new"), destination, {
          stageWrite(path, bytes, options) {
            writeFileSync(path, bytes.subarray(0, 1), options);
            throw new Error("disk full");
          },
        }),
      /disk full/,
    );
    assert.deepEqual(readdirSync(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rolls back a failed publication and removes staging", () => {
  const root = fixture();
  const destination = join(root, "asset.bin");
  writeFileSync(destination, "old");
  let calls = 0;
  try {
    assert.throws(
      () =>
        publishFreezeBytes(Buffer.from("new"), destination, {
          rename(from, to) {
            if (++calls === 2) throw new Error("publish failed");
            renameSync(from, to);
          },
        }),
      /publish failed/,
    );
    assert.equal(readFileSync(destination, "utf8"), "old");
    assert.deepEqual(readdirSync(root), ["asset.bin"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a competing publisher fails closed while a publication owns the lock", () => {
  const root = fixture();
  const destination = join(root, "asset.bin");
  try {
    publishFreezeBytes(Buffer.from("first"), destination, {
      stageWrite(path, bytes, options) {
        assert.throws(() => publishFreezeBytes(Buffer.from("second"), destination), {
          code: "EEXIST",
        });
        writeFileSync(path, bytes, options);
      },
    });
    assert.equal(readFileSync(destination, "utf8"), "first");
    assert.deepEqual(readdirSync(root), ["asset.bin"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("new assets keep POSIX owner-only mode; Windows ACL equivalence is not claimed", () => {
  const root = fixture();
  const destination = join(root, "asset.bin");
  try {
    publishFreezeBytes(Buffer.from("new"), destination);
    if (process.platform !== "win32") assert.equal(statSync(destination).mode & 0o777, 0o600);
    assert.equal(readFileSync(destination, "utf8"), "new");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("file publication copies real multi-chunk media with bounded reads", () => {
  const root = fixture();
  const source = join(root, "source.bin");
  const destination = join(root, "asset.bin");
  const content = Buffer.alloc(2 * 1024 * 1024 + 37);
  for (let i = 0; i < content.length; i++) content[i] = i % 251;
  writeFileSync(source, content);
  let reads = 0;
  let largest = 0;
  try {
    assert.equal(
      typeof publisher.publishFreezeFile,
      "function",
      "a bounded-memory file entry point exists",
    );
    publisher.publishFreezeFile(source, destination, {
      chunkSize: 4096,
      read(fd, buffer, offset, length, position) {
        reads++;
        largest = Math.max(largest, length);
        return readSync(fd, buffer, offset, length, position);
      },
    });
    assert.ok(reads > 1000, "real source and staging reads span many chunks");
    assert.equal(largest, 4096);
    assert.deepEqual(readFileSync(destination), content);
    assert.deepEqual(readdirSync(root).sort(), ["asset.bin", "source.bin"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("destination named previous cannot collide with internal staging or recovery", () => {
  const root = fixture();
  try {
    for (const name of ["previous", "PREVIOUS"]) {
      const destination = join(root, name);
      publishFreezeBytes(Buffer.from("new"), destination);
      assert.equal(readFileSync(destination, "utf8"), "new");
      publishFreezeBytes(Buffer.from("replacement"), destination);
      assert.equal(readFileSync(destination, "utf8"), "replacement");
      rmSync(destination);
    }
    assert.deepEqual(readdirSync(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("file staging completes short writes and cleans an actual zero-progress write failure", () => {
  const root = fixture();
  const source = join(root, "source.bin");
  const destination = join(root, "asset.bin");
  const bytes = Buffer.alloc(1025, 42);
  writeFileSync(source, bytes);
  let writes = 0;
  try {
    publisher.publishFreezeFile(source, destination, {
      chunkSize: 32,
      write(fd, buffer, offset, length, position) {
        writes++;
        return writeSync(fd, buffer, offset, Math.min(length, 7), position);
      },
    });
    assert.ok(writes > 100);
    assert.deepEqual(readFileSync(destination), bytes);
    assert.throws(
      () =>
        publisher.publishFreezeFile(source, destination, {
          write() {
            return 0;
          },
        }),
      /write was incomplete/,
    );
    assert.deepEqual(readFileSync(destination), bytes);
    assert.deepEqual(readdirSync(root).sort(), ["asset.bin", "source.bin"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("file staging verifies real written bytes and preserves the old destination on corruption", () => {
  const root = fixture();
  const source = join(root, "source.bin");
  const destination = join(root, "asset.bin");
  writeFileSync(source, "new");
  writeFileSync(destination, "old");
  try {
    assert.throws(
      () =>
        publisher.publishFreezeFile(source, destination, {
          write(fd, buffer, offset, length, position) {
            return writeSync(fd, Buffer.alloc(length), 0, length, position);
          },
        }),
      /did not match source/,
    );
    assert.equal(readFileSync(destination, "utf8"), "old");
    assert.deepEqual(readdirSync(root).sort(), ["asset.bin", "source.bin"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("file publication also rolls back destination previous after a publish failure", () => {
  const root = fixture();
  const source = join(root, "source.bin");
  const destination = join(root, "previous");
  writeFileSync(source, "new");
  writeFileSync(destination, "old");
  let calls = 0;
  try {
    assert.throws(
      () =>
        publisher.publishFreezeFile(source, destination, {
          rename(from, to) {
            if (++calls === 2) throw new Error("file publish failure");
            renameSync(from, to);
          },
        }),
      /file publish failure/,
    );
    assert.equal(readFileSync(destination, "utf8"), "old");
    assert.deepEqual(readdirSync(root).sort(), ["previous", "source.bin"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
