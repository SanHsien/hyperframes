import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { cachedLocalVectorRevision, installLocalVectors } from "./localSemantic.js";
import { LOCAL_MODEL_DIMENSIONS } from "./localModel.js";

describe("installLocalVectors", () => {
  let dir: string;
  let sourceDir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "hf-vec-"));
    sourceDir = mkdtempSync(join(tmpdir(), "hf-vec-source-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });

  /** A metadata/matrix pair that agrees: one name, one row of the real width. */
  const writePair = (names: string[], dimensions: number, floats: number, revision?: string) => {
    writeFileSync(
      join(sourceDir, "local-vectors.json"),
      JSON.stringify({ names, dimensions, revision }),
    );
    writeFileSync(join(sourceDir, "local-vectors.bin"), new Float32Array(floats));
  };

  it("copies both bundled files into the cache directory", async () => {
    writePair(["whip-pan"], LOCAL_MODEL_DIMENSIONS, LOCAL_MODEL_DIMENSIONS);
    expect(await installLocalVectors({ directory: dir, sourceDirectory: sourceDir })).toBe(true);
    expect(existsSync(join(dir, "local-vectors.bin"))).toBe(true);
    expect(existsSync(join(dir, "local-vectors.json"))).toBe(true);
  });

  it("locates the repository-bundled pair by default", async () => {
    expect(await installLocalVectors({ directory: dir })).toBe(true);
    expect(cachedLocalVectorRevision(dir)).toBeTruthy();
  });

  it("caches nothing when the matrix is short of the names it claims", async () => {
    // Half a download is the case worth refusing: written, it loads as an
    // error on every later search until someone clears the cache by hand.
    writePair(["whip-pan", "rack-focus"], LOCAL_MODEL_DIMENSIONS, LOCAL_MODEL_DIMENSIONS);
    expect(await installLocalVectors({ directory: dir, sourceDirectory: sourceDir })).toBe(false);
    expect(existsSync(join(dir, "local-vectors.bin"))).toBe(false);
    expect(existsSync(join(dir, "local-vectors.json"))).toBe(false);
  });

  it("caches nothing when the vectors came from a different model", async () => {
    writePair(["whip-pan"], 1536, 1536);
    expect(await installLocalVectors({ directory: dir, sourceDirectory: sourceDir })).toBe(false);
    expect(existsSync(join(dir, "local-vectors.json"))).toBe(false);
  });

  it("reports failure instead of throwing when the bundled pair is unavailable", async () => {
    rmSync(sourceDir, { recursive: true, force: true });
    expect(await installLocalVectors({ directory: dir, sourceDirectory: sourceDir })).toBe(false);
  });

  it("refuses an unexpected revision without replacing the previous pair", async () => {
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "local-vectors.json"),
      JSON.stringify({ names: ["old"], dimensions: LOCAL_MODEL_DIMENSIONS, revision: "old" }),
    );
    writeFileSync(join(dir, "local-vectors.bin"), new Float32Array(LOCAL_MODEL_DIMENSIONS));
    writePair(["new"], LOCAL_MODEL_DIMENSIONS, LOCAL_MODEL_DIMENSIONS, "old");

    expect(
      await installLocalVectors({
        directory: dir,
        sourceDirectory: sourceDir,
        expectedRevision: "new",
      }),
    ).toBe(false);
    expect(JSON.parse(readFileSync(join(dir, "local-vectors.json"), "utf-8"))).toEqual({
      names: ["old"],
      dimensions: LOCAL_MODEL_DIMENSIONS,
      revision: "old",
    });
  });

  it("reads the revision only from a complete cached pair", () => {
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "local-vectors.json"),
      JSON.stringify({ names: ["whip-pan"], dimensions: LOCAL_MODEL_DIMENSIONS, revision: "r1" }),
    );
    expect(cachedLocalVectorRevision(dir)).toBeUndefined();

    writeFileSync(join(dir, "local-vectors.bin"), new Float32Array(LOCAL_MODEL_DIMENSIONS));
    expect(cachedLocalVectorRevision(dir)).toBe("r1");
  });
});
