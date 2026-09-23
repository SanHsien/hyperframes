import { describe, expect, it } from "bun:test";
import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createContext, runInContext } from "node:vm";

const fixtureRoot = join(import.meta.dir, "..");
const bundlePaths = [
  join(fixtureRoot, "three-boundary", "src", "vendor", "three-0.186.0.min.js"),
  join(fixtureRoot, "three-boundary-deferred", "src", "vendor", "three-0.186.0.min.js"),
];

describe("vendored Three.js", () => {
  it("keeps both fixture bundles byte-identical", () => {
    expect(readFileSync(bundlePaths[0])).toEqual(readFileSync(bundlePaths[1]));
  });

  it("generates UUIDs without Math.random", () => {
    const context = createContext({ crypto: webcrypto, console });
    runInContext("Math.random = () => { throw new Error('Math.random called') }", context);
    runInContext(readFileSync(bundlePaths[0], "utf8"), context);

    const uuid = runInContext("THREE.MathUtils.generateUUID()", context) as string;
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
