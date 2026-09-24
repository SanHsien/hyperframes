// @vitest-environment node
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findFFmpeg } from "../browser/ffmpeg.js";
import { normalizeVideoBuffer, normalizeVideoStream } from "./videoNormalization.js";

const dirs: string[] = [];

function scratch(): string {
  const dir = mkdtempSync(join(tmpdir(), "hf-video-normalize-"));
  dirs.push(dir);
  return dir;
}

function fixtureVideo(ffmpegPath: string): Buffer {
  const result = spawnSync(
    ffmpegPath,
    [
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "color=c=blue:s=32x32:r=10",
      "-t",
      "0.2",
      "-c:v",
      "mpeg4",
      "-movflags",
      "frag_keyframe+empty_moov",
      "-f",
      "mp4",
      "pipe:1",
    ],
    { encoding: null, maxBuffer: 4 * 1024 * 1024 },
  );
  expect(result.status, result.stderr?.toString()).toBe(0);
  return result.stdout;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe.runIf(Boolean(findFFmpeg()))("video normalization", () => {
  const ffmpegPath = findFFmpeg()!;

  it("remuxes buffered cloud video before publishing", () => {
    const output = join(scratch(), "buffered.mp4");
    expect(normalizeVideoBuffer(fixtureVideo(ffmpegPath), output, ffmpegPath)).toBe(true);
    expect(existsSync(output)).toBe(true);
    expect(statSync(output).size).toBeGreaterThan(0);
  });

  it("preserves support for m4v downloads", () => {
    const output = join(scratch(), "buffered.m4v");
    expect(normalizeVideoBuffer(fixtureVideo(ffmpegPath), output, ffmpegPath)).toBe(true);
    expect(statSync(output).size).toBeGreaterThan(0);
  });

  it("streams cloud video through ffmpeg before publishing", async () => {
    const source = fixtureVideo(ffmpegPath);
    const output = join(scratch(), "streamed.mp4");
    async function* chunks(): AsyncIterable<Uint8Array> {
      yield source.subarray(0, 1024);
      yield source.subarray(1024);
    }
    await expect(
      normalizeVideoStream(chunks(), output, ffmpegPath, source.length + 1),
    ).resolves.toBe(source.length);
    expect(existsSync(output)).toBe(true);
    expect(statSync(output).size).toBeGreaterThan(0);
  });

  it("rejects invalid video without publishing it", () => {
    const output = join(scratch(), "invalid.mp4");
    expect(normalizeVideoBuffer(Buffer.alloc(2048, 0x61), output, ffmpegPath)).toBe(false);
    expect(existsSync(output)).toBe(false);
  });

  it("preserves an existing destination", () => {
    const output = join(scratch(), "existing.mp4");
    writeFileSync(output, "existing");
    expect(() => normalizeVideoBuffer(fixtureVideo(ffmpegPath), output, ffmpegPath)).toThrow();
    expect(readFileSync(output, "utf8")).toBe("existing");
  });

  it("stops an oversized stream without publishing it", async () => {
    const source = fixtureVideo(ffmpegPath);
    const output = join(scratch(), "oversized.mp4");
    async function* chunks(): AsyncIterable<Uint8Array> {
      yield source;
    }
    await expect(
      normalizeVideoStream(chunks(), output, ffmpegPath, source.length - 1),
    ).rejects.toThrow("byte cap");
    expect(existsSync(output)).toBe(false);
  });
});
