import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

// Windows answers a recursive mkdir of a drive root (D:\) with EPERM though the root exists. A --shot
// output written directly in a root failed before the image was written; this mock stands in for Windows.
vi.mock("node:fs", async (importOriginal) => {
  const real = await importOriginal<typeof import("node:fs")>();
  return {
    ...real,
    mkdirSync: vi.fn((path: string, options: fs.MakeDirectoryOptions) => {
      if (real.statSync(path, { throwIfNoEntry: false })?.isDirectory())
        throw Object.assign(new Error(`EPERM: operation not permitted, mkdir '${path}'`), {
          code: "EPERM",
        });
      return real.mkdirSync(path, options);
    }),
  };
});

const { ensureShotOutputDir } = await import("./motionShot.js");

describe("ensureShotOutputDir on an existing output folder", () => {
  const made: string[] = [];
  afterEach(() => {
    for (const dir of made.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
  });

  it("does not fail when the output sits directly in a folder that is already there (a drive root)", () => {
    const root = fs.mkdtempSync(join(tmpdir(), "hf-shot-root-"));
    made.push(root);
    expect(() => ensureShotOutputDir(join(root, "shot.png"))).not.toThrow();
  });

  it("still makes the folders above a missing output folder", () => {
    const root = fs.mkdtempSync(join(tmpdir(), "hf-shot-new-"));
    made.push(root);
    ensureShotOutputDir(join(root, "a", "b", "shot.png"));
    expect(fs.statSync(join(root, "a", "b")).isDirectory()).toBe(true);
  });
});
