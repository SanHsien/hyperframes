// @vitest-environment node
import { describe, expect, it, afterEach, vi } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exceedsFreezeCap, freezeBytes, MAX_FREEZE_BYTES } from "./freeze";

const dirs: string[] = [];
function scratch(): string {
  const d = mkdtempSync(join(tmpdir(), "hf-freeze-"));
  dirs.push(d);
  return d;
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("exceedsFreezeCap", () => {
  it("is false at and under the cap, true just over it", () => {
    expect(exceedsFreezeCap(MAX_FREEZE_BYTES)).toBe(false);
    expect(exceedsFreezeCap(MAX_FREEZE_BYTES + 1)).toBe(true);
  });
});

describe("freezeBytes", () => {
  it("writes bytes to a nested path and returns the length", () => {
    const dest = join(scratch(), "images", "a.png");
    const bytes = new Uint8Array([1, 2, 3, 4]);
    expect(freezeBytes(bytes, dest)).toBe(4);
    expect(Array.from(readFileSync(dest))).toEqual([1, 2, 3, 4]);
  });

  it("throws on empty bytes", () => {
    expect(() => freezeBytes(new Uint8Array(0), join(scratch(), "x"))).toThrow();
  });
});

describe("freezeUrl allowlist", () => {
  it("accepts figma + figma-s3 hosts, https only", async () => {
    const { isAllowedFreezeUrl } = await import("./freeze");
    expect(isAllowedFreezeUrl("https://s3-alpha-sig.figma.com/img/x")).toBe(true);
    expect(isAllowedFreezeUrl("https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/x")).toBe(
      true,
    );
    expect(isAllowedFreezeUrl("http://s3-alpha-sig.figma.com/img/x")).toBe(false);
    expect(isAllowedFreezeUrl("https://169.254.169.254/latest/meta-data/")).toBe(false);
    expect(isAllowedFreezeUrl("https://evilfigma.com/x")).toBe(false);
    expect(isAllowedFreezeUrl("https://attacker-bucket.s3.amazonaws.com/x")).toBe(false);
    expect(isAllowedFreezeUrl("file:///etc/passwd")).toBe(false);
    expect(isAllowedFreezeUrl("not a url")).toBe(false);
  });

  it("refuses to freeze from a non-allowlisted url", async () => {
    const { freezeUrl } = await import("./freeze");
    await expect(freezeUrl("http://localhost:6379/x", "/tmp/never")).rejects.toThrow(
      /refusing non-figma url/,
    );
  });

  it("validates and publishes an allowlisted remote asset", async () => {
    const { freezeUrl } = await import("./freeze");
    const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 1]);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(png, { headers: { "content-type": "image/png" } }),
    );
    const destination = join(scratch(), "x.png");
    await expect(freezeUrl("https://s3-alpha-sig.figma.com/img/x", destination)).resolves.toBe(
      png.length,
    );
    expect(Array.from(readFileSync(destination))).toEqual(Array.from(png));
    vi.restoreAllMocks();
  });

  it("revalidates every redirect before making the next request", async () => {
    const { freezeUrl } = await import("./freeze");
    const request = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(null, { status: 302, headers: { location: "http://169.254.169.254/x" } }),
      );
    await expect(
      freezeUrl("https://s3-alpha-sig.figma.com/img/x", join(scratch(), "x.png")),
    ).rejects.toThrow(/refusing non-figma url/);
    expect(request).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  });

  it("rejects active SVG content", async () => {
    const { freezeUrl } = await import("./freeze");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('<svg xmlns="http://www.w3.org/2000/svg"><foreignObject/></svg>', {
        headers: { "content-type": "image/svg+xml" },
      }),
    );
    await expect(
      freezeUrl("https://s3-alpha-sig.figma.com/img/x", join(scratch(), "x.svg")),
    ).rejects.toThrow(/destination format/);
    vi.restoreAllMocks();
  });

  it.each([
    '<svg xmlns="http://www.w3.org/2000/svg"><set attributeName="href" to="https://private.example/x.svg"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><rect style="fill:u\\72l(https://private.example/x.svg)"/></svg>',
  ])("rejects SVG mutation and CSS-escape bypasses", async (svg) => {
    const { freezeUrl } = await import("./freeze");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(svg, { headers: { "content-type": "image/svg+xml" } }),
    );
    await expect(
      freezeUrl("https://s3-alpha-sig.figma.com/img/x", join(scratch(), "x.svg")),
    ).rejects.toThrow(/destination format/);
    vi.restoreAllMocks();
  });

  it("rejects mismatched remote bytes without replacing an existing asset", async () => {
    const { freezeUrl } = await import("./freeze");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not a png", { headers: { "content-type": "image/png" } }),
    );
    const destination = join(scratch(), "x.png");
    writeFileSync(destination, "existing");
    await expect(freezeUrl("https://s3-alpha-sig.figma.com/img/x", destination)).rejects.toThrow(
      /destination format/,
    );
    expect(readFileSync(destination, "utf8")).toBe("existing");
    vi.restoreAllMocks();
  });
});
