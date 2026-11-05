import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hyperframesCacheDir } from "./cacheDir.js";

afterEach(() => vi.unstubAllEnvs());

describe("hyperframesCacheDir", () => {
  it("defaults to ~/.cache/hyperframes", () => {
    vi.stubEnv("HYPERFRAMES_CACHE_DIR", "");
    expect(hyperframesCacheDir()).toBe(join(homedir(), ".cache", "hyperframes"));
    expect(hyperframesCacheDir("chrome")).toBe(join(homedir(), ".cache", "hyperframes", "chrome"));
  });

  it("follows HYPERFRAMES_CACHE_DIR, read on each call, a relative one resolved", () => {
    const elsewhere = join(tmpdir(), "elsewhere-cache");
    vi.stubEnv("HYPERFRAMES_CACHE_DIR", elsewhere);
    expect(hyperframesCacheDir("whisper", "models")).toBe(join(elsewhere, "whisper", "models"));
    vi.stubEnv("HYPERFRAMES_CACHE_DIR", "rel/cache");
    expect(hyperframesCacheDir("tts")).toBe(join(resolve("rel/cache"), "tts"));
  });
});
