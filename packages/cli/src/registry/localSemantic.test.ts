import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  cachedLocalVectorRevision,
  installLocalVectors,
  isMediaVectorRow,
  mediaSemanticRanking,
  vectorPairAgrees,
} from "./localSemantic.js";
import { LOCAL_MODEL_DIMENSIONS } from "./localModel.js";

describe("media-vector validation", () => {
  const row = {
    id: "click",
    kind: "sfx",
    title: "click",
    description: "short click",
    tags: ["ui"],
    file: "click.mp3",
    duration: 0.2,
  };

  it.each([
    ["null", null],
    ["missing id", { ...row, id: undefined }],
    ["non-string tags", { ...row, tags: ["ui", 3] }],
    ["negative duration", { ...row, duration: -1 }],
    ["zero width", { ...row, dimensions: { width: 0, height: 10 } }],
  ])("rejects %s rows", (_name, candidate) => {
    expect(isMediaVectorRow(candidate)).toBe(false);
  });

  it("accepts a complete media row", () => {
    expect(isMediaVectorRow(row)).toBe(true);
    expect(isMediaVectorRow({ ...row, dimensions: { width: 1920, height: 1080 } })).toBe(true);
  });

  const invalidPairs: Array<[string, Array<[string, Buffer]>]> = [
    ["missing metadata", [["media-vectors.bin", Buffer.alloc(4)]]],
    ["missing matrix", [["media-vectors.json", Buffer.from("{}")]]],
    [
      "invalid json",
      [
        ["media-vectors.json", Buffer.from("not json")],
        ["media-vectors.bin", Buffer.alloc(4)],
      ],
    ],
    [
      "invalid media row",
      [
        [
          "media-vectors.json",
          Buffer.from(
            JSON.stringify({ names: ["click"], dimensions: 1, rows: [{ ...row, id: "other" }] }),
          ),
        ],
        ["media-vectors.bin", Buffer.alloc(4)],
      ],
    ],
  ];

  it.each(invalidPairs)("rejects pairs with %s", (_name, fetched) => {
    expect(vectorPairAgrees(fetched, "media-vectors")).toBe(false);
  });

  it("accepts a matching media-vector pair", () => {
    const metadata = {
      names: ["click"],
      dimensions: LOCAL_MODEL_DIMENSIONS,
      rows: [row],
    };
    expect(
      vectorPairAgrees(
        [
          ["media-vectors.json", Buffer.from(JSON.stringify(metadata))],
          ["media-vectors.bin", Buffer.alloc(4 * LOCAL_MODEL_DIMENSIONS)],
        ],
        "media-vectors",
      ),
    ).toBe(true);
  });
});

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

  it("does not touch the network: it succeeds even when fetch throws", async () => {
    // The catalog cache is filled only from the bundled package, never from a
    // downloaded response, so a fetch that explodes must not matter.
    const fetchStub = vi.fn(() => {
      throw new Error("network must not be used");
    });
    vi.stubGlobal("fetch", fetchStub);
    try {
      writePair(["whip-pan"], LOCAL_MODEL_DIMENSIONS, LOCAL_MODEL_DIMENSIONS);
      expect(await installLocalVectors({ directory: dir, sourceDirectory: sourceDir })).toBe(true);
      expect(await installLocalVectors({ directory: dir })).toBe(true);
      expect(fetchStub).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("reports no semantic result without a media-vector cache", async () => {
    expect(await mediaSemanticRanking("click", dir)).toBeNull();
  });

  describe("media-vectors", () => {
    const mediaRow = {
      id: "click",
      kind: "sfx",
      title: "click",
      description: "short click",
      tags: ["ui"],
      file: "click.mp3",
      duration: 0.2,
    };

    const writeMediaPair = (metadata: string | unknown, floats = LOCAL_MODEL_DIMENSIONS) => {
      writeFileSync(
        join(sourceDir, "media-vectors.json"),
        typeof metadata === "string" ? metadata : JSON.stringify(metadata),
      );
      writeFileSync(join(sourceDir, "media-vectors.bin"), new Float32Array(floats));
    };

    const installMedia = () =>
      installLocalVectors({
        directory: dir,
        sourceDirectory: sourceDir,
        artifactBasename: "media-vectors",
      });

    it("accepts a complete media-vector pair with validated rows", async () => {
      writeMediaPair({ names: ["click"], dimensions: LOCAL_MODEL_DIMENSIONS, rows: [mediaRow] });

      expect(await installMedia()).toBe(true);
      expect(existsSync(join(dir, "media-vectors.json"))).toBe(true);
      expect(existsSync(join(dir, "media-vectors.bin"))).toBe(true);
    });

    it.each([
      ["missing rows", {}],
      ["wrong row count", { rows: [] }],
      ["wrong row shape", { rows: [{ ...mediaRow, tags: ["ui", 3] }] }],
      ["wrong row id", { rows: [{ ...mediaRow, id: "other" }] }],
      ["invalid duration", { rows: [{ ...mediaRow, duration: -1 }] }],
      ["invalid dimensions", { rows: [{ ...mediaRow, dimensions: { width: 0, height: 10 } }] }],
    ])("rejects media-vector metadata with %s", async (_reason, extra) => {
      writeMediaPair({ names: ["click"], dimensions: LOCAL_MODEL_DIMENSIONS, ...extra });

      expect(await installMedia()).toBe(false);
      expect(existsSync(join(dir, "media-vectors.json"))).toBe(false);
    });

    it("rejects an unreadable media-vector metadata file", async () => {
      writeMediaPair("not json");

      expect(await installMedia()).toBe(false);
    });
  });
});
