import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { privateAnimatedGifCacheDir } from "./compileStage.js";

// CodeQL #177: the animated-GIF cache shares the extract cache root, so a root
// another local user could have created or linked must disable it before use.
describe("privateAnimatedGifCacheDir", () => {
  let scratch: string;
  const warnings: unknown[] = [];
  const log = { warn: (...args: unknown[]) => warnings.push(args) };

  beforeEach(() => {
    scratch = mkdtempSync(join(tmpdir(), "hf-gif-cache-test-"));
    warnings.length = 0;
  });

  afterEach(() => {
    rmSync(scratch, { recursive: true, force: true });
  });

  it("returns undefined when no extract cache is configured", () => {
    expect(privateAnimatedGifCacheDir(undefined, log)).toBeUndefined();
    expect(warnings).toHaveLength(0);
  });

  it("uses animated-gif under a private root", () => {
    const root = join(scratch, "cache");
    expect(privateAnimatedGifCacheDir(root, log)).toBe(join(root, "animated-gif"));
    expect(warnings).toHaveLength(0);
  });

  it("disables only the GIF cache when the root is not a directory", () => {
    const root = join(scratch, "not-a-dir");
    writeFileSync(root, "");
    expect(privateAnimatedGifCacheDir(root, log)).toBeUndefined();
    expect(warnings).toHaveLength(1);
  });

  // Windows has no uid or mode bits, and symlink creation needs elevation there.
  it.skipIf(process.platform === "win32")(
    "disables the GIF cache for a world-writable root",
    () => {
      const root = join(scratch, "open-cache");
      mkdirSync(root);
      chmodSync(root, 0o777);
      expect(privateAnimatedGifCacheDir(root, log)).toBeUndefined();
      expect(warnings).toHaveLength(1);
    },
  );

  it.skipIf(process.platform === "win32")("disables the GIF cache for a symlinked root", () => {
    const target = join(scratch, "elsewhere");
    mkdirSync(target, { mode: 0o700 });
    const root = join(scratch, "cache-link");
    symlinkSync(target, root);
    expect(privateAnimatedGifCacheDir(root, log)).toBeUndefined();
    expect(warnings).toHaveLength(1);
  });
});
