import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { normalizeCloudImage } from "./image-normalize.mjs";

test(
  "normalizeCloudImage decodes cloud bytes from stdin before publishing",
  { skip: spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status !== 0 },
  (t) => {
    const dir = mkdtempSync(join(tmpdir(), "hf-image-normalize-"));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const source = spawnSync(
      "ffmpeg",
      [
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        "color=c=red:s=16x16",
        "-frames:v",
        "1",
        "-f",
        "image2",
        "-vcodec",
        "png",
        "pipe:1",
      ],
      { encoding: null, maxBuffer: 1024 * 1024 },
    );
    assert.equal(source.status, 0, source.stderr?.toString());
    const output = join(dir, "normalized.ico");
    assert.equal(normalizeCloudImage(source.stdout, output), true);
    assert.equal(existsSync(output), true);
    const normalized = readFileSync(output);
    assert.ok(normalized.length > 6);
    assert.equal(normalized.readUInt16LE(0), 0);
    assert.equal(normalized.readUInt16LE(2), 1);
  },
);

test(
  "normalizeCloudImage preserves an output created concurrently",
  { skip: spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status !== 0 },
  (t) => {
    const dir = mkdtempSync(join(tmpdir(), "hf-image-normalize-race-"));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const source = spawnSync(
      "ffmpeg",
      [
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        "color=c=blue:s=16x16",
        "-frames:v",
        "1",
        "-f",
        "image2",
        "-vcodec",
        "png",
        "pipe:1",
      ],
      { encoding: null, maxBuffer: 1024 * 1024 },
    );
    assert.equal(source.status, 0, source.stderr?.toString());
    const output = join(dir, "avatar.png");
    writeFileSync(output, "winner");
    assert.throws(
      () => normalizeCloudImage(source.stdout, output, { replaceExisting: false }),
      (error) => error?.code === "EEXIST",
    );
    assert.equal(readFileSync(output, "utf8"), "winner");
  },
);
