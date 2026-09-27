import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const fixtureBundles = [
  new URL("../../producer/tests/hdr-regression/src/vendor/hyper-shader.global.js", import.meta.url),
  new URL(
    "../../producer/tests/page-side-shader-compositor-render-compat/src/vendor/hyper-shader.global.js",
    import.meta.url,
  ),
].map((url) => fileURLToPath(url));

describe("html2canvas dependency patch", () => {
  it("constructs the cloned document without parsing serialized DOM text", () => {
    const entry = require.resolve("html2canvas");
    const source = readFileSync(entry, "utf8");

    expect(source).not.toContain("documentClone.write(");
    expect(source).toContain("documentClone.implementation.createDocumentType(");
  });

  it("keeps the browser fixture bundles byte-identical and free of the unsafe sink", () => {
    const bundles = fixtureBundles.map((path) => readFileSync(path));

    expect(bundles[0]).toEqual(bundles[1]);
    const source = bundles[0].toString("utf8");
    expect(source).not.toContain(".write(serializeDoctype");
    expect(source).toContain(".implementation.createDocumentType(");
  });
});
