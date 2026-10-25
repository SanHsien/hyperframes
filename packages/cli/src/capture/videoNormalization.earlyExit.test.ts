// @vitest-environment node
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { normalizeVideoStream } from "./videoNormalization.js";

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("normalizeVideoStream when ffmpeg exits before the stream ends", () => {
  it("rejects instead of crashing on the closed stdin pipe", async () => {
    const dir = mkdtempSync(join(tmpdir(), "hf-video-early-exit-"));
    dirs.push(dir);
    const output = join(dir, "early.mp4");
    // `node -y ...` is a bad option: the child exits at once, closing the pipe.
    async function* chunks(): AsyncIterable<Uint8Array> {
      for (let i = 0; i < 64; i += 1) yield Buffer.alloc(1024 * 1024, 0x61);
    }
    await expect(
      normalizeVideoStream(chunks(), output, process.execPath, 128 * 1024 * 1024),
    ).rejects.toThrow();
    expect(existsSync(output)).toBe(false);
  });
});
